package app.capgo.permissions

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray

@CapacitorPlugin(name = "Permissions")
class PermissionsPlugin : Plugin() {

    private lateinit var implementation: Permissions
    private var permissionLauncher: ActivityResultLauncher<Array<String>>? = null
    private var pendingCall: PluginCall? = null
    private var pendingName: String? = null
    private var pendingQueue: MutableList<String> = mutableListOf()
    private var pendingStatuses: JSObject? = null
    private var pendingIsMultiple: Boolean = false

    override fun load() {
        implementation = Permissions(context)
        permissionLauncher =
            bridge.registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { _ ->
                finishPermissionRequest()
            }
    }

    @PluginMethod
    fun check(call: PluginCall) {
        val name = call.getString("permission")
        if (name.isNullOrBlank()) {
            call.reject("permission is required")
            return
        }
        call.resolve(statusResult(implementation.checkStatus(name, activity)))
    }

    @PluginMethod
    fun request(call: PluginCall) {
        val name = call.getString("permission")
        if (name.isNullOrBlank()) {
            call.reject("permission is required")
            return
        }
        startRequest(call, listOf(name), multiple = false)
    }

    @PluginMethod
    fun checkMultiple(call: PluginCall) {
        val names = readPermissionList(call) ?: return
        val statuses = JSObject()
        for (name in names) {
            statuses.put(name, implementation.checkStatus(name, activity))
        }
        val ret = JSObject()
        ret.put("statuses", statuses)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestMultiple(call: PluginCall) {
        val names = readPermissionList(call) ?: return
        startRequest(call, names, multiple = true)
    }

    @PluginMethod
    fun shouldShowRationale(call: PluginCall) {
        val name = call.getString("permission")
        if (name.isNullOrBlank()) {
            call.reject("permission is required")
            return
        }
        val ret = JSObject()
        ret.put("shouldShow", implementation.shouldShowRationale(name, activity))
        call.resolve(ret)
    }

    @PluginMethod
    fun openSettings(call: PluginCall) {
        val type = call.getString("type") ?: "application"
        val intent =
            if (type == "notifications") {
                Intent().apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    } else {
                        action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                        data = Uri.fromParts("package", context.packageName, null)
                    }
                }
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                }
            }
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
        call.resolve()
    }

    @PluginMethod
    fun requestPreciseLocation(call: PluginCall) {
        startRequest(call, listOf("locationWhenInUse"), multiple = false)
    }

    @PluginMethod
    fun getPluginVersion(call: PluginCall) {
        call.resolve(JSObject().put("version", implementation.getPluginVersion()))
    }

    private fun startRequest(call: PluginCall, names: List<String>, multiple: Boolean) {
        if (pendingCall != null) {
            call.reject("Another permission request is in progress")
            return
        }
        pendingCall = call
        pendingIsMultiple = multiple
        pendingStatuses = JSObject()
        pendingQueue = names.toMutableList()
        requestNext()
    }

    private fun requestNext() {
        val call = pendingCall ?: return
        if (pendingQueue.isEmpty()) {
            finishAll(call)
            return
        }
        val name = pendingQueue.removeAt(0)
        pendingName = name
        val perms =
            try {
                implementation.androidPermissionsToRequest(name)
            } catch (e: SecurityException) {
                pendingStatuses?.put(name, Permissions.UNAVAILABLE)
                requestNext()
                return
            }
        if (perms == null) {
            pendingStatuses?.put(name, Permissions.UNAVAILABLE)
            requestNext()
            return
        }
        if (perms.isEmpty()) {
            implementation.markAsked(name)
            pendingStatuses?.put(name, Permissions.GRANTED)
            requestNext()
            return
        }
        val status = implementation.checkStatus(name, activity)
        if (status == Permissions.GRANTED || status == Permissions.LIMITED) {
            pendingStatuses?.put(name, status)
            requestNext()
            return
        }
        if (status == Permissions.UNAVAILABLE) {
            pendingStatuses?.put(name, Permissions.UNAVAILABLE)
            requestNext()
            return
        }
        val launcher = permissionLauncher
        if (launcher == null) {
            // Fallback to ActivityCompat if launcher is missing
            try {
                ActivityCompat.requestPermissions(activity, perms, 29101)
            } catch (e: SecurityException) {
                pendingStatuses?.put(name, Permissions.UNAVAILABLE)
                requestNext()
                return
            }
            // Without launcher callback we resolve after marking asked via check
            implementation.markAsked(name)
            pendingStatuses?.put(name, implementation.checkStatus(name, activity))
            requestNext()
            return
        }
        try {
            launcher.launch(perms)
        } catch (e: SecurityException) {
            pendingStatuses?.put(name, Permissions.UNAVAILABLE)
            requestNext()
        }
    }

    private fun finishPermissionRequest() {
        val name = pendingName ?: return
        implementation.markAsked(name)
        val status = implementation.checkStatus(name, activity)
        // locationAlways on Q+ needs a second prompt for background after foreground.
        if (name == "locationAlways" &&
            status != Permissions.GRANTED &&
            status != Permissions.UNAVAILABLE &&
            status != Permissions.BLOCKED
        ) {
            val nextPerms = implementation.androidPermissionsToRequest(name)
            if (nextPerms != null &&
                nextPerms.size == 1 &&
                nextPerms[0] == Manifest.permission.ACCESS_BACKGROUND_LOCATION
            ) {
                val launcher = permissionLauncher
                if (launcher != null) {
                    try {
                        launcher.launch(nextPerms)
                        return
                    } catch (_: SecurityException) {
                        pendingStatuses?.put(name, Permissions.UNAVAILABLE)
                        requestNext()
                        return
                    }
                }
            }
        }
        pendingStatuses?.put(name, implementation.checkStatus(name, activity))
        requestNext()
    }

    private fun finishAll(call: PluginCall) {
        val statuses = pendingStatuses ?: JSObject()
        pendingCall = null
        pendingName = null
        pendingStatuses = null
        pendingQueue = mutableListOf()
        if (pendingIsMultiple) {
            val ret = JSObject()
            ret.put("statuses", statuses)
            call.resolve(ret)
        } else {
            val keys = statuses.keys()
            val first = if (keys.hasNext()) keys.next() else null
            val status =
                if (first != null) {
                    statuses.getString(first) ?: Permissions.UNAVAILABLE
                } else {
                    Permissions.UNAVAILABLE
                }
            call.resolve(statusResult(status))
        }
    }

    private fun statusResult(status: String): JSObject {
        return JSObject().put("status", status)
    }

    private fun readPermissionList(call: PluginCall): List<String>? {
        val arr: JSONArray? = call.getArray("permissions")
        if (arr == null || arr.length() == 0) {
            call.reject("permissions is required")
            return null
        }
        val list = mutableListOf<String>()
        for (i in 0 until arr.length()) {
            val value = arr.optString(i, "")
            if (value.isNotBlank()) {
                list.add(value)
            }
        }
        if (list.isEmpty()) {
            call.reject("permissions is required")
            return null
        }
        return list
    }
}
