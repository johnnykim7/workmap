package com.therecommerce.workmap.file;

/**
 * 파일 업로드 응답(CR-024). 에디터는 {@code url}만 받아 {@code <img src>}로 삽입한다.
 * axopm FileUploadResult와 동형(url/fileName/fileSize/contentType).
 */
public record FileUploadResponse(
        String url,
        String fileName,
        long fileSize,
        String contentType
) {
}
