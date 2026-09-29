package app.capgo.permissions

import com.getcapacitor.Logger

class Permissions {

    fun echo(value: String): String {
        Logger.info("Echo", value)

        return value
    }

    fun getPluginVersion(): String {
        return "native"
    }
}
