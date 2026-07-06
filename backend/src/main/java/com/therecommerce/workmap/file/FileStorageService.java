package com.therecommerce.workmap.file;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * 파일 저장 서비스(CR-024 — 리치 에디터 인라인 이미지). 서버 로컬 디스크 저장.
 * - 저장 파일명: UUID + 원본 확장자(충돌·경로 traversal 방지).
 * - 타입 화이트리스트(UploadProperties.allowedContentTypes) 검증.
 * - 저장 경로/허용 타입은 application.yml workmap.upload.*로 조정.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final UploadProperties props;

    /** 파일을 로컬 디스크에 저장하고 공개 URL을 포함한 응답을 반환한다. */
    public FileUploadResponse store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(WmpErrorCode.FILE_EMPTY);
        }
        String contentType = file.getContentType();
        String ext = extensionOf(file.getOriginalFilename());  // 소문자 ".md" 등(비허용문자면 "")
        String extNoDot = ext.startsWith(".") ? ext.substring(1) : ext;
        // MIME 화이트리스트 OR 확장자 화이트리스트(CR-037). md 등은 브라우저가 MIME를 비우거나
        // octet-stream으로 보내므로 확장자로 보조 판정한다.
        boolean mimeOk = contentType != null && props.getAllowedContentTypes().contains(contentType);
        boolean extOk = !extNoDot.isBlank() && props.getAllowedExtensions().contains(extNoDot);
        if (!mimeOk && !extOk) {
            throw new BusinessException(WmpErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        String storedName = UUID.randomUUID() + ext;
        Path dir = Paths.get(props.getDir());
        try {
            Files.createDirectories(dir);
            Path target = dir.resolve(storedName).normalize();
            // traversal 방어: 정규화 후에도 반드시 dir 하위여야 함
            if (!target.startsWith(dir.normalize())) {
                throw new BusinessException(WmpErrorCode.FILE_STORAGE_FAILED);
            }
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("파일 저장 실패: {}", storedName, e);
            throw new BusinessException(WmpErrorCode.FILE_STORAGE_FAILED);
        }

        String url = props.getPublicBase().replaceAll("/+$", "") + "/" + storedName;
        return new FileUploadResponse(url, file.getOriginalFilename(), file.getSize(), contentType);
    }

    /** 저장된 파일을 Resource로 로드(정적 서빙). 저장 디렉터리 밖 접근은 거부. */
    public Resource load(String storedName) {
        Path dir = Paths.get(props.getDir()).normalize();
        Path target = dir.resolve(storedName).normalize();
        if (!target.startsWith(dir) || !Files.exists(target)) {
            throw new BusinessException(WmpErrorCode.FILE_NOT_FOUND);
        }
        try {
            Resource resource = new UrlResource(target.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new BusinessException(WmpErrorCode.FILE_NOT_FOUND);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessException(WmpErrorCode.FILE_NOT_FOUND);
        }
    }

    /**
     * 저장된 파일을 디스크에서 삭제(best-effort, CR-037 첨부 삭제).
     * - filePath는 저장 URL(public-base + "/" + storedName) 또는 storedName 자체를 허용.
     * - 저장 디렉터리 밖(traversal)·이미 없는 파일은 조용히 무시(로그만).
     * - 삭제 실패가 첨부 메타 삭제를 막지 않도록 예외를 던지지 않는다.
     */
    public void deleteByPath(String filePathOrName) {
        if (filePathOrName == null || filePathOrName.isBlank()) return;
        String storedName = filePathOrName.substring(filePathOrName.lastIndexOf('/') + 1);
        if (storedName.isBlank()) return;
        try {
            Path dir = Paths.get(props.getDir()).normalize();
            Path target = dir.resolve(storedName).normalize();
            if (!target.startsWith(dir)) {
                log.warn("첨부 파일 삭제 경로 이탈 무시: {}", filePathOrName);
                return;
            }
            Files.deleteIfExists(target);
        } catch (Exception e) {
            log.warn("첨부 파일 디스크 삭제 실패(메타 삭제는 진행): {}", storedName, e);
        }
    }

    /** 저장된 파일의 content-type 추정(서빙 시 헤더용). 알 수 없으면 octet-stream. */
    public String probeContentType(String storedName) {
        try {
            Path target = Paths.get(props.getDir()).resolve(storedName).normalize();
            String type = Files.probeContentType(target);
            return type != null ? type : "application/octet-stream";
        } catch (IOException e) {
            return "application/octet-stream";
        }
    }

    private String extensionOf(String originalName) {
        if (originalName == null) return "";
        int dot = originalName.lastIndexOf('.');
        if (dot < 0 || dot == originalName.length() - 1) return "";
        String ext = originalName.substring(dot);
        // 확장자에 경로구분자/이상문자 차단(영숫자+점만 허용)
        return ext.matches("\\.[A-Za-z0-9]{1,10}") ? ext.toLowerCase() : "";
    }
}
