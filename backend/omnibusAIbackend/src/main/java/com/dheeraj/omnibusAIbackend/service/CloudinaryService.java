package com.dheeraj.omnibusAIbackend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file, String userId) throws IOException {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "omnibus_users/user_" + userId + "/profile",
                    "public_id", "avatar",
                    "overwrite", true,
                    "resource_type", "image"
            ));

            return uploadResult.get("secure_url").toString();

        } catch (Exception e) {
            throw new RuntimeException("Avatar upload failed: " + e.getMessage());
        }
    }

    public String uploadFile(MultipartFile file, String userId) throws IOException {
        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "omnibus_users/user_" + userId + "/documents",
                    "resource_type", "auto",
                    "use_filename", true,
                    "unique_filename", true
            ));

            return uploadResult.get("secure_url").toString();

        } catch (Exception e) {
            throw new RuntimeException("Document upload failed: " + e.getMessage());
        }
    }

    public void deleteUserData(String userId) {
        String basePrefix = "omnibus_users/user_" + userId;
        try {
            cloudinary.api().deleteResourcesByPrefix(basePrefix, ObjectUtils.emptyMap());

            try {
                cloudinary.api().deleteFolder(basePrefix + "/profile", ObjectUtils.emptyMap());
            } catch (Exception ignored) {}

            try {
                cloudinary.api().deleteFolder(basePrefix + "/documents", ObjectUtils.emptyMap());
            } catch (Exception ignored) {}

            try {
                cloudinary.api().deleteFolder(basePrefix, ObjectUtils.emptyMap());
            } catch (Exception ignored) {}

        } catch (Exception e) {
            System.err.println("Warning: Failed to fully delete Cloudinary data for user " + userId + " -> " + e.getMessage());
        }
    }
}