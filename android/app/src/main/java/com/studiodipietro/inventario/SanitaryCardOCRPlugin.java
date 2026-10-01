package com.studiodipietro.inventario;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

@CapacitorPlugin(name = "SanitaryCardOCR")
public class SanitaryCardOCRPlugin extends Plugin {

    @PluginMethod
    public void recognize(PluginCall call) {
        String base64 = call.getString("image");

        if (base64 == null || base64.isEmpty()) {
            call.reject("Immagine mancante");
            return;
        }

        try {
            String cleanBase64 = base64;

            if (cleanBase64.contains(",")) {
                cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
            }

            byte[] imageBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(
                imageBytes,
                0,
                imageBytes.length
            );

            if (bitmap == null) {
                call.reject("Impossibile decodificare l'immagine");
                return;
            }

            InputImage image = InputImage.fromBitmap(bitmap, 0);

            TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
                .process(image)
                .addOnSuccessListener(result -> {
                    JSObject response = new JSObject();
                    response.put("text", result.getText());
                    call.resolve(response);
                    bitmap.recycle();
                })
                .addOnFailureListener(error -> {
                    bitmap.recycle();
                    call.reject("Errore ML Kit OCR: " + error.getMessage());
                });

        } catch (Exception e) {
            call.reject("Errore elaborazione immagine: " + e.getMessage());
        }
    }
}
