package com.capacitorjs.plugins.filetransfer

import android.os.Build
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.JSValue
import com.getcapacitor.PluginCall
import io.ionic.libs.ionfiletransferlib.model.IONFLTRTransferHttpOptions
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.DataOutputStream
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.Base64

// This file is basically a conversion of https://github.com/ionic-team/capacitor/blob/main/android/capacitor/src/main/java/com/getcapacitor/plugin/util/CapacitorHttpUrlConnection.java#L192
// to Kotlin and returning a ByteArray instead of directly writing into the output stream

fun getRequestBody(call: PluginCall, http: IONFLTRTransferHttpOptions): ByteArray? {
    val contentType = http.headers["Content-Type"]
    if (contentType.isNullOrBlank()) return null

    val method = http.method
    val isHttpMutate =
        method == "DELETE" || method == "PATCH" || method == "POST" || method == "PUT"
    if (!isHttpMutate) return null

    val body = JSValue(call, "data")
    val bodyType = call.getString("dataType")

    if (contentType.contains("application/json")) {
        return stringToRequestBody(body.toString())
    } else if (bodyType != null && bodyType == "file") {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Base64.getDecoder().decode(body.toString())
        } else {
            android.util.Base64.decode(body.toString(), android.util.Base64.DEFAULT)
        }
    } else if (contentType.contains("application/x-www-form-urlencoded")) {
        try {
            val obj = body.toJSObject()
            return objectToRequestBody(obj)
        } catch (e: Exception) {
            return stringToRequestBody(body.toString())
        }
    } else if (bodyType != null && bodyType == "formData") {
        return formDataToRequestBody(contentType, body.toJSArray())
    } else {
        return stringToRequestBody(body.toString())
    }
}

fun stringToRequestBody(from: String): ByteArray {
    return from.toByteArray(Charsets.UTF_8)
}

fun objectToRequestBody(from: JSObject): ByteArray {
    val bytes = ByteArrayOutputStream()
    DataOutputStream(bytes).use { os ->
        val keys = from.keys()
        for (key in keys) {
            val d = from.get(key)
            os.writeBytes(URLEncoder.encode(key, "UTF-8"))
            os.writeBytes("=")
            os.writeBytes(URLEncoder.encode(d.toString(), "UTF-8"))

            if (keys.hasNext()) {
                os.writeBytes("&")
            }
        }
    }
    return bytes.toByteArray()
}

fun formDataToRequestBody(contentType: String, entries: JSArray): ByteArray {
    val bytes = ByteArrayOutputStream()
    DataOutputStream(bytes).use { os ->
        val boundary = contentType.split(";")[1].split("=")[1]
        val lineEnd = "\r\n"
        val twoHyphens = "--"

        for (e in entries.toList<Any>()) {
            if (e is JSONObject) {
                val type = e.getString("type")
                val key = e.getString("key")
                val value = e.getString("value")
                if (type == "string") {
                    os.writeBytes(twoHyphens + boundary + lineEnd)
                    os.writeBytes("Content-Disposition: form-data; name=\"$key\"$lineEnd$lineEnd")
                    os.write(value.toByteArray(StandardCharsets.UTF_8))
                    os.writeBytes(lineEnd)
                } else if (type == "base64File") {
                    val fileName = e.getString("fileName")
                    val fileContentType = e.getString("contentType")

                    os.writeBytes(twoHyphens + boundary + lineEnd)
                    os.writeBytes("Content-Disposition: form-data; name=\"$key\"; filename=\"$fileName\"$lineEnd")
                    os.writeBytes("Content-Type: $fileContentType$lineEnd")
                    os.writeBytes("Content-Transfer-Encoding: binary$lineEnd")
                    os.writeBytes(lineEnd)

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        os.write(Base64.getDecoder().decode(value))
                    } else {
                        os.write(android.util.Base64.decode(value, android.util.Base64.DEFAULT))
                    }

                    os.writeBytes(lineEnd)
                }
            }
        }
    }
    return bytes.toByteArray()
}