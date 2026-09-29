import Foundation
import AVFoundation
import Photos
import Contacts
import EventKit
import CoreBluetooth
import CoreMotion
import Speech
import AppTrackingTransparency
import CoreLocation
import UserNotifications

public enum PermissionStatusValue: String {
    case granted
    case denied
    case blocked
    case limited
    case unavailable
}

enum PermissionStatusMapper {
    static func fromPhoto(_ status: PHAuthorizationStatus) -> PermissionStatusValue {
        switch status {
        case .authorized: return .granted
        case .limited: return .limited
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromContacts(_ status: CNAuthorizationStatus) -> PermissionStatusValue {
        switch status {
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        default:
            if #available(iOS 18.0, *), status == .limited {
                return .limited
            }
            return .unavailable
        }
    }

    static func fromEventKit(_ status: EKAuthorizationStatus) -> PermissionStatusValue {
        if #available(iOS 17.0, *) {
            switch status {
            case .fullAccess: return .granted
            case .writeOnly: return .limited
            case .denied: return .denied
            case .restricted: return .blocked
            case .notDetermined: return .denied
            @unknown default: return .unavailable
            }
        }
        switch status {
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        default: return .unavailable
        }
    }

    static func fromAV(_ status: AVAuthorizationStatus) -> PermissionStatusValue {
        switch status {
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromTracking(_ status: ATTrackingManager.AuthorizationStatus) -> PermissionStatusValue {
        switch status {
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromSpeech(_ status: SFSpeechRecognizerAuthorizationStatus) -> PermissionStatusValue {
        switch status {
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromBluetooth(_ status: CBManagerAuthorization) -> PermissionStatusValue {
        switch status {
        case .allowedAlways: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromMotion(_ status: CMAuthorizationStatus) -> PermissionStatusValue {
        switch status {
        case .authorized: return .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromLocation(
        _ status: CLAuthorizationStatus,
        accuracy: CLAccuracyAuthorization?
    ) -> PermissionStatusValue {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            return accuracy == .reducedAccuracy ? .limited : .granted
        case .denied: return .denied
        case .restricted: return .blocked
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }

    static func fromNotifications(_ settings: UNNotificationSettings) -> PermissionStatusValue {
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral: return .granted
        case .denied: return .denied
        case .notDetermined: return .denied
        @unknown default: return .unavailable
        }
    }
}
