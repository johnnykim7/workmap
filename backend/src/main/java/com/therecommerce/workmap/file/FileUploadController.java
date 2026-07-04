package com.therecommerce.workmap.file;

import com.therecommerce.common.response.ResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

/**
 * 파일 업로드 API(CR-024 — 리치 에디터 인라인 이미지).
 * - POST /api/v1/files/upload : multipart 업로드 → 저장 URL 반환(인증 필요).
 * - GET  /api/v1/files/{name} : 업로드 파일 정적 서빙(img src 렌더용, 화이트리스트 공개).
 * work_item에 종속하지 않는 독립 경로(만들기 모달 시점엔 항목 ID 부재).
 */
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseDto<FileUploadResponse> upload(@RequestParam("file") MultipartFile file) {
        return ResponseDto.success(fileStorageService.store(file));
    }

    /**
     * 업로드 파일 정적 서빙(화이트리스트 공개).
     * - name: 원본 파일명(옵션). 지정 시 Content-Disposition filename으로 사용(미지정 시 Spring 기본 f.txt 방지).
     * - download=true: attachment(내려받기)로, 아니면 inline(브라우저 미리보기).
     */
    @GetMapping("/serve/{storedName}")
    public ResponseEntity<Resource> serve(
            @PathVariable String storedName,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download) {
        Resource resource = fileStorageService.load(storedName);
        String contentType = fileStorageService.probeContentType(storedName);
        // 파일명: 원본명(name) 우선, 없으면 저장명(UUID.ext). Spring이 붙이던 f.txt 기본값을 덮는다.
        String filename = (name != null && !name.isBlank()) ? name : storedName;
        ContentDisposition disposition = ContentDisposition
                .builder(download ? "attachment" : "inline")
                .filename(filename, StandardCharsets.UTF_8)  // RFC 5987(한글 파일명 인코딩)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
                .body(resource);
    }
}
