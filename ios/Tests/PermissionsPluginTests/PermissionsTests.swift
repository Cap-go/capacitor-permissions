import XCTest
@testable import PermissionsPlugin
import Photos
import AVFoundation
import Contacts
import Speech
import AppTrackingTransparency
import CoreBluetooth
import CoreLocation

class PermissionsTests: XCTestCase {
    func testPhotoStatusMapping() {
        XCTAssertEqual(PermissionStatusMapper.fromPhoto(.authorized), .granted)
        XCTAssertEqual(PermissionStatusMapper.fromPhoto(.limited), .limited)
        XCTAssertEqual(PermissionStatusMapper.fromPhoto(.denied), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromPhoto(.restricted), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromPhoto(.notDetermined), .denied)
    }

    func testAVStatusMapping() {
        XCTAssertEqual(PermissionStatusMapper.fromAV(.authorized), .granted)
        XCTAssertEqual(PermissionStatusMapper.fromAV(.denied), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromAV(.restricted), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromAV(.notDetermined), .denied)
    }

    func testContactsStatusMapping() {
        XCTAssertEqual(PermissionStatusMapper.fromContacts(.authorized), .granted)
        XCTAssertEqual(PermissionStatusMapper.fromContacts(.denied), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromContacts(.restricted), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromContacts(.notDetermined), .denied)
    }

    func testSpeechStatusMapping() {
        XCTAssertEqual(PermissionStatusMapper.fromSpeech(.authorized), .granted)
        XCTAssertEqual(PermissionStatusMapper.fromSpeech(.denied), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromSpeech(.restricted), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromSpeech(.notDetermined), .denied)
    }

    func testTrackingStatusMapping() {
        XCTAssertEqual(PermissionStatusMapper.fromTracking(.authorized), .granted)
        XCTAssertEqual(PermissionStatusMapper.fromTracking(.denied), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromTracking(.restricted), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromTracking(.notDetermined), .denied)
    }

    func testBluetoothStatusMapping() {
        XCTAssertEqual(PermissionStatusMapper.fromBluetooth(.allowedAlways), .granted)
        XCTAssertEqual(PermissionStatusMapper.fromBluetooth(.denied), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromBluetooth(.restricted), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromBluetooth(.notDetermined), .denied)
    }

    func testLocationStatusMapping() {
        XCTAssertEqual(
            PermissionStatusMapper.fromLocation(.authorizedWhenInUse, accuracy: .fullAccuracy),
            .granted
        )
        XCTAssertEqual(
            PermissionStatusMapper.fromLocation(.authorizedWhenInUse, accuracy: .reducedAccuracy),
            .limited
        )
        XCTAssertEqual(PermissionStatusMapper.fromLocation(.denied, accuracy: nil), .denied)
        XCTAssertEqual(PermissionStatusMapper.fromLocation(.restricted, accuracy: nil), .blocked)
        XCTAssertEqual(PermissionStatusMapper.fromLocation(.notDetermined, accuracy: nil), .denied)
    }

    func testGetPluginVersion() {
        let implementation = Permissions()
        XCTAssertEqual("native", implementation.getPluginVersion())
    }
}
