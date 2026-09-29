import XCTest
@testable import PermissionsPlugin

class PermissionsTests: XCTestCase {
    func testEcho() {
        let implementation = Permissions()
        let value = "Hello, World!"
        let result = implementation.echo(value)

        XCTAssertEqual(value, result)
    }

    func testGetPluginVersion() {
        let implementation = Permissions()
        let result = implementation.getPluginVersion()

        XCTAssertEqual("native", result)
    }
}
