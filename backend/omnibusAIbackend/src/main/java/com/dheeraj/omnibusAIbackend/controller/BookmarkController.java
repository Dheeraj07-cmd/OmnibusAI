package com.dheeraj.omnibusAIbackend.controller;

import com.dheeraj.omnibusAIbackend.entity.Bookmark;
import com.dheeraj.omnibusAIbackend.entity.User;
import com.dheeraj.omnibusAIbackend.repository.BookmarkRepository;
import com.dheeraj.omnibusAIbackend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkRepository bookmarkRepository;
    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<List<Bookmark>> getUserBookmarks(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookmarkRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<Bookmark> createBookmark(@AuthenticationPrincipal User user, @RequestBody Bookmark request) {

        Bookmark bookmark = Bookmark.builder()
                .user(user)
                .title(request.getTitle())
                .url(request.getUrl())
                .description(request.getDescription())
                .build();

        Bookmark savedBookmark = bookmarkRepository.save(bookmark);

        // Log the activity
        analyticsService.logActivity(user, "Saved bookmark: " + request.getTitle(), "Bookmarks", "Success", 0);

        return ResponseEntity.ok(savedBookmark);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBookmark(@AuthenticationPrincipal User user, @PathVariable Long id) {

        Bookmark bookmark = bookmarkRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bookmark not found"));

        // verify that user trying to delete its own bookmark or not
        if (!bookmark.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        bookmarkRepository.delete(bookmark);
        analyticsService.logActivity(user, "Deleted bookmark", "Bookmarks", "Success", 0);

        return ResponseEntity.noContent().build();
    }
}