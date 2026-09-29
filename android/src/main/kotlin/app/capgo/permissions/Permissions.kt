package app.capgo.permissions

import android.Manifest
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.Logger

class Permissions(private val context: Context) {
    companion object {
        const val GRANTED = "granted"
        const val DENIED = "denied"
        const val BLOCKED = "blocked"
        const val LIMITED = "limited"
        const val UNAVAILABLE = "unavailable"
        private const val PREFS = "capgo_permissions_asked"
    }

    private val prefs: SharedPreferences
        get() = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun getPluginVersion(): String = "native"

    fun markAsked(permission: String) {
        prefs.edit().putBoolean(permission, true).apply()
    }

    fun wasAsked(permission: String): Boolean = prefs.getBoolean(permission, false)

    fun androidPermissionsFor(name: String): Array<String>? = permissionsFor(name, forRequest = false)

    fun androidPermissionsToRequest(name: String): Array<String>? = permissionsFor(name, forRequest = true)

    private fun permissionsFor(name: String, forRequest: Boolean): Array<String>? {
        return when (name) {
            "camera" -> arrayOf(Manifest.permission.CAMERA)
            "microphone", "speechRecognition" -> arrayOf(Manifest.permission.RECORD_AUDIO)
            "photoLibrary", "mediaImages" -> mediaImagePermissions(forRequest)
            "photoLibraryAddOnly" -> writeStoragePermissions()
            "contacts" -> arrayOf(Manifest.permission.READ_CONTACTS)
            "calendar" -> arrayOf(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)
            "locationWhenInUse" -> arrayOf(
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION,
            )
            "locationAlways" -> locationAlwaysPermissions(forRequest)
            "bluetooth" -> bluetoothPermissions()
            "motion", "activityRecognition" -> activityRecognitionPermissions()
            "notifications" -> notificationPermissions()
            "phone" -> arrayOf(Manifest.permission.READ_PHONE_STATE)
            "sms" -> arrayOf(Manifest.permission.READ_SMS, Manifest.permission.RECEIVE_SMS)
            "mediaAudio" -> mediaAudioPermissions()
            "mediaVideo" -> mediaVideoPermissions()
            "reminders", "appTrackingTransparency" -> null
            else -> null
        }
    }

    fun checkStatus(name: String, activity: android.app.Activity?): String {
        val declarePerms =
            if (name == "locationAlways") {
                androidPermissionsFor(name)
            } else {
                androidPermissionsToRequest(name)
            } ?: return UNAVAILABLE
        if (declarePerms.isEmpty()) {
            return GRANTED
        }
        try {
            if (!allDeclared(declarePerms)) {
                return UNAVAILABLE
            }
            if (name == "photoLibrary" || name == "mediaImages") {
                return checkPhotoLibraryStatus(activity)
            }
            val checkPerms = androidPermissionsFor(name) ?: return UNAVAILABLE
            val allGranted = checkPerms.all { isGranted(it) }
            if (allGranted) {
                return GRANTED
            }
            // locationAlways: fine/coarse may be granted while background is not
            if (name == "locationAlways" && partialLocationAlwaysGranted()) {
                return DENIED
            }
            return deniedOrBlocked(name, checkPerms, activity)
        } catch (e: SecurityException) {
            Logger.error("Permissions", "SecurityException checking $name", e)
            return UNAVAILABLE
        }
    }

    fun shouldShowRationale(name: String, activity: android.app.Activity?): Boolean {
        val perms = androidPermissionsFor(name) ?: return false
        if (activity == null || perms.isEmpty()) {
            return false
        }
        return perms.any { ActivityCompat.shouldShowRequestPermissionRationale(activity, it) }
    }

    private fun checkPhotoLibraryStatus(activity: android.app.Activity?): String {
        if (Build.VERSION.SDK_INT >= 33) {
            val full = isGranted(Manifest.permission.READ_MEDIA_IMAGES)
            if (full) {
                return GRANTED
            }
            if (Build.VERSION.SDK_INT >= 34 &&
                isGranted(Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED)
            ) {
                return LIMITED
            }
            return deniedOrBlocked(
                "photoLibrary",
                arrayOf(Manifest.permission.READ_MEDIA_IMAGES),
                activity,
            )
        }
        val storage = Manifest.permission.READ_EXTERNAL_STORAGE
        if (isGranted(storage)) {
            return GRANTED
        }
        return deniedOrBlocked("photoLibrary", arrayOf(storage), activity)
    }

    private fun deniedOrBlocked(
        name: String,
        perms: Array<String>,
        activity: android.app.Activity?,
    ): String {
        if (activity != null &&
            perms.any { ActivityCompat.shouldShowRequestPermissionRationale(activity, it) }
        ) {
            return DENIED
        }
        if (!wasAsked(name)) {
            return DENIED
        }
        return BLOCKED
    }

    private fun partialLocationAlwaysGranted(): Boolean {
        val foreground =
            isGranted(Manifest.permission.ACCESS_FINE_LOCATION) ||
                isGranted(Manifest.permission.ACCESS_COARSE_LOCATION)
        if (!foreground) {
            return false
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            return !isGranted(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
        }
        return false
    }

    private fun isGranted(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(context, permission) ==
            PackageManager.PERMISSION_GRANTED
    }

    private fun allDeclared(perms: Array<String>): Boolean {
        val requested = declaredPermissions()
        return perms.all { requested.contains(it) }
    }

    private fun declaredPermissions(): Set<String> {
        return try {
            val flags = PackageManager.GET_PERMISSIONS
            val info = context.packageManager.getPackageInfo(context.packageName, flags)
            info.requestedPermissions?.toSet() ?: emptySet()
        } catch (_: Exception) {
            emptySet()
        }
    }

    private fun mediaImagePermissions(forRequest: Boolean): Array<String> {
        return if (Build.VERSION.SDK_INT >= 33) {
            if (!forRequest && Build.VERSION.SDK_INT >= 34) {
                arrayOf(
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_VISUAL_USER_SELECTED,
                )
            } else {
                arrayOf(Manifest.permission.READ_MEDIA_IMAGES)
            }
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    private fun mediaAudioPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= 33) {
            arrayOf(Manifest.permission.READ_MEDIA_AUDIO)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    private fun mediaVideoPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= 33) {
            arrayOf(Manifest.permission.READ_MEDIA_VIDEO)
        } else {
            arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
        }
    }

    private fun writeStoragePermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            emptyArray()
        } else {
            arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE)
        }
    }

    private fun locationAlwaysPermissions(forRequest: Boolean): Array<String> {
        val foreground =
            arrayOf(
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION,
            )
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            return foreground
        }
        if (!forRequest) {
            return foreground + Manifest.permission.ACCESS_BACKGROUND_LOCATION
        }
        val hasForeground =
            isGranted(Manifest.permission.ACCESS_FINE_LOCATION) ||
                isGranted(Manifest.permission.ACCESS_COARSE_LOCATION)
        return if (hasForeground) {
            arrayOf(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
        } else {
            foreground
        }
    }

    private fun bluetoothPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            arrayOf(
                Manifest.permission.BLUETOOTH_CONNECT,
                Manifest.permission.BLUETOOTH_SCAN,
            )
        } else {
            emptyArray()
        }
    }

    private fun activityRecognitionPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            arrayOf(Manifest.permission.ACTIVITY_RECOGNITION)
        } else {
            emptyArray()
        }
    }

    private fun notificationPermissions(): Array<String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(Manifest.permission.POST_NOTIFICATIONS)
        } else {
            emptyArray()
        }
    }
}
