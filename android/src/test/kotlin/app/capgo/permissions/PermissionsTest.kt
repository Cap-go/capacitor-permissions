package app.capgo.permissions

import android.Manifest
import android.os.Build
import androidx.test.core.app.ApplicationProvider
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE])
class PermissionsTest {

    private val implementation = Permissions(ApplicationProvider.getApplicationContext())

    @Test
    fun getPluginVersionReturnsNativeMarker() {
        assertEquals("native", implementation.getPluginVersion())
    }

    @Test
    fun remindersAndTrackingAreUnavailableOnAndroid() {
        assertNull(implementation.androidPermissionsFor("reminders"))
        assertNull(implementation.androidPermissionsFor("appTrackingTransparency"))
        assertEquals(Permissions.UNAVAILABLE, implementation.checkStatus("reminders", null))
    }

    @Test
    fun cameraMapsToCameraPermission() {
        assertArrayEquals(
            arrayOf(Manifest.permission.CAMERA),
            implementation.androidPermissionsFor("camera"),
        )
    }

    @Test
    fun locationWhenInUseMapsToFineAndCoarse() {
        assertArrayEquals(
            arrayOf(
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION,
            ),
            implementation.androidPermissionsFor("locationWhenInUse"),
        )
    }

    @Test
    fun markAskedTracksPermissionKeys() {
        assertFalse(implementation.wasAsked("camera"))
        implementation.markAsked("camera")
        assertTrue(implementation.wasAsked("camera"))
    }

    @Test
    fun notificationsUsePostNotificationsOnApi33() {
        assertArrayEquals(
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            implementation.androidPermissionsFor("notifications"),
        )
    }
}
