import Foundation
import AVFoundation
import Photos
import Contacts
import EventKit
import CoreLocation
import CoreBluetooth
import CoreMotion
import UserNotifications
import Speech
import AppTrackingTransparency

@objc public class Permissions: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    private var locationContinuation: ((PermissionStatusValue) -> Void)?
    private var preciseContinuation: ((PermissionStatusValue) -> Void)?

    override public init() {
        super.init()
        locationManager.delegate = self
    }

    @objc public func getPluginVersion() -> String {
        return "native"
    }

    public func check(_ name: String, completion: @escaping (PermissionStatusValue) -> Void) {
        switch name {
        case "camera":
            completion(PermissionStatusMapper.fromAV(AVCaptureDevice.authorizationStatus(for: .video)))
        case "microphone":
            completion(PermissionStatusMapper.fromAV(AVCaptureDevice.authorizationStatus(for: .audio)))
        case "photoLibrary":
            completion(PermissionStatusMapper.fromPhoto(PHPhotoLibrary.authorizationStatus(for: .readWrite)))
        case "photoLibraryAddOnly":
            completion(PermissionStatusMapper.fromPhoto(PHPhotoLibrary.authorizationStatus(for: .addOnly)))
        case "contacts":
            completion(PermissionStatusMapper.fromContacts(CNContactStore.authorizationStatus(for: .contacts)))
        case "calendar":
            completion(PermissionStatusMapper.fromEventKit(EKEventStore.authorizationStatus(for: .event)))
        case "reminders":
            completion(PermissionStatusMapper.fromEventKit(EKEventStore.authorizationStatus(for: .reminder)))
        case "locationWhenInUse", "locationAlways":
            completion(checkLocation(name))
        case "bluetooth":
            completion(PermissionStatusMapper.fromBluetooth(CBManager.authorization))
        case "motion":
            completion(checkMotion())
        case "notifications":
            UNUserNotificationCenter.current().getNotificationSettings { settings in
                completion(PermissionStatusMapper.fromNotifications(settings))
            }
        case "speechRecognition":
            completion(PermissionStatusMapper.fromSpeech(SFSpeechRecognizer.authorizationStatus()))
        case "appTrackingTransparency":
            completion(PermissionStatusMapper.fromTracking(ATTrackingManager.trackingAuthorizationStatus))
        default:
            completion(.unavailable)
        }
    }

    public func request(_ name: String, completion: @escaping (PermissionStatusValue) -> Void) {
        switch name {
        case "camera":
            AVCaptureDevice.requestAccess(for: .video) { _ in self.check(name, completion: completion) }
        case "microphone":
            AVCaptureDevice.requestAccess(for: .audio) { _ in self.check(name, completion: completion) }
        case "photoLibrary":
            PHPhotoLibrary.requestAuthorization(for: .readWrite) { _ in
                self.check(name, completion: completion)
            }
        case "photoLibraryAddOnly":
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { _ in
                self.check(name, completion: completion)
            }
        case "contacts":
            CNContactStore().requestAccess(for: .contacts) { _, _ in
                self.check(name, completion: completion)
            }
        case "calendar":
            requestCalendar(completion)
        case "reminders":
            requestReminders(completion)
        case "locationWhenInUse":
            requestLocation(always: false, completion: completion)
        case "locationAlways":
            requestLocation(always: true, completion: completion)
        case "bluetooth":
            requestBluetooth(completion)
        case "motion":
            requestMotion(completion)
        case "notifications":
            UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in
                self.check(name, completion: completion)
            }
        case "speechRecognition":
            SFSpeechRecognizer.requestAuthorization { _ in self.check(name, completion: completion) }
        case "appTrackingTransparency":
            ATTrackingManager.requestTrackingAuthorization { _ in
                self.check(name, completion: completion)
            }
        default:
            check(name, completion: completion)
        }
    }

    public func requestPreciseLocation(completion: @escaping (PermissionStatusValue) -> Void) {
        let status = locationManager.authorizationStatus
        guard status == .authorizedWhenInUse || status == .authorizedAlways else {
            completion(PermissionStatusMapper.fromLocation(
                status,
                accuracy: locationManager.accuracyAuthorization
            ))
            return
        }
        if locationManager.accuracyAuthorization == .fullAccuracy {
            completion(.granted)
            return
        }
        preciseContinuation = completion
        locationManager.requestTemporaryFullAccuracyAuthorization(withPurposeKey: "PreciseLocation") { _ in
            let cont = self.preciseContinuation
            self.preciseContinuation = nil
            cont?(PermissionStatusMapper.fromLocation(
                self.locationManager.authorizationStatus,
                accuracy: self.locationManager.accuracyAuthorization
            ))
        }
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if let cont = locationContinuation {
            locationContinuation = nil
            let name = manager.authorizationStatus == .authorizedAlways
                ? "locationAlways"
                : "locationWhenInUse"
            check(name, completion: cont)
        }
    }

    private func checkLocation(_ name: String) -> PermissionStatusValue {
        let status = locationManager.authorizationStatus
        let accuracy = locationManager.accuracyAuthorization
        if name == "locationAlways" {
            if status == .authorizedAlways {
                return accuracy == .reducedAccuracy ? .limited : .granted
            }
            if status == .authorizedWhenInUse {
                return .denied
            }
        }
        return PermissionStatusMapper.fromLocation(status, accuracy: accuracy)
    }

    private func checkMotion() -> PermissionStatusValue {
        if CMMotionActivityManager.isActivityAvailable() {
            return PermissionStatusMapper.fromMotion(CMMotionActivityManager.authorizationStatus())
        }
        if CMPedometer.isPedometerEventTrackingAvailable() {
            return PermissionStatusMapper.fromMotion(CMPedometer.authorizationStatus())
        }
        return .unavailable
    }

    private func requestCalendar(_ completion: @escaping (PermissionStatusValue) -> Void) {
        let store = EKEventStore()
        if #available(iOS 17.0, *) {
            store.requestFullAccessToEvents { _, _ in
                self.check("calendar", completion: completion)
            }
        } else {
            store.requestAccess(to: .event) { _, _ in
                self.check("calendar", completion: completion)
            }
        }
    }

    private func requestReminders(_ completion: @escaping (PermissionStatusValue) -> Void) {
        let store = EKEventStore()
        if #available(iOS 17.0, *) {
            store.requestFullAccessToReminders { _, _ in
                self.check("reminders", completion: completion)
            }
        } else {
            store.requestAccess(to: .reminder) { _, _ in
                self.check("reminders", completion: completion)
            }
        }
    }

    private func requestLocation(always: Bool, completion: @escaping (PermissionStatusValue) -> Void) {
        locationContinuation = completion
        if always {
            locationManager.requestAlwaysAuthorization()
        } else {
            locationManager.requestWhenInUseAuthorization()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            if let cont = self.locationContinuation {
                self.locationContinuation = nil
                self.check(always ? "locationAlways" : "locationWhenInUse", completion: cont)
            }
        }
    }

    private func requestBluetooth(_ completion: @escaping (PermissionStatusValue) -> Void) {
        _ = CBCentralManager(delegate: nil, queue: nil, options: [
            CBCentralManagerOptionShowPowerAlertKey: false
        ])
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.check("bluetooth", completion: completion)
        }
    }

    private func requestMotion(_ completion: @escaping (PermissionStatusValue) -> Void) {
        let manager = CMMotionActivityManager()
        let now = Date()
        manager.queryActivityStarting(from: now, to: now, to: .main) { _, _ in
            self.check("motion", completion: completion)
        }
    }
}
