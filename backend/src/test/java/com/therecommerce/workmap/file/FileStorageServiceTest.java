package com.therecommerce.workmap.file;

import com.therecommerce.common.exception.BusinessException;
import com.therecommerce.workmap.common.exception.WmpErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * FileStorageService 단위테스트(CR-024). 로컬 디스크 저장·타입 화이트리스트·서빙 가드.
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService service;

    @BeforeEach
    void setUp() {
        UploadProperties props = new UploadProperties();
        props.setDir(tempDir.toString());
        props.setPublicBase("/api/v1/files/serve");
        props.setAllowedContentTypes(List.of("image/png", "image/jpeg"));
        service = new FileStorageService(props);
    }

    @Test
    @DisplayName("이미지업로드_정상_디스크저장및URL반환")
    void store_validImage_savesAndReturnsUrl() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "shot.png", "image/png", "PNGDATA".getBytes());

        FileUploadResponse res = service.store(file);

        assertThat(res.url()).startsWith("/api/v1/files/serve/");
        assertThat(res.url()).endsWith(".png");
        assertThat(res.fileName()).isEqualTo("shot.png");
        assertThat(res.fileSize()).isEqualTo("PNGDATA".getBytes().length);
        assertThat(res.contentType()).isEqualTo("image/png");
        // 실제 디스크에 저장됐는지
        String stored = res.url().substring(res.url().lastIndexOf('/') + 1);
        assertThat(Files.exists(tempDir.resolve(stored))).isTrue();
    }

    @Test
    @DisplayName("빈파일_업로드_거부됨")
    void store_emptyFile_throws() {
        MockMultipartFile empty = new MockMultipartFile("file", "a.png", "image/png", new byte[0]);
        assertThatThrownBy(() -> service.store(empty))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.FILE_EMPTY);
    }

    @Test
    @DisplayName("허용안된타입_업로드_거부됨")
    void store_disallowedType_throws() {
        MockMultipartFile pdf = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "PDF".getBytes());
        assertThatThrownBy(() -> service.store(pdf))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.FILE_TYPE_NOT_ALLOWED);
    }

    @Test
    @DisplayName("화이트리스트에포함된문서타입_업로드_허용됨")
    void store_allowedDocumentType_succeeds() {
        // 첨부(WMP-WI-012)는 문서류도 업로드 가능 — 화이트리스트에 pdf를 두면 통과한다.
        UploadProperties docProps = new UploadProperties();
        docProps.setDir(tempDir.toString());
        docProps.setPublicBase("/api/v1/files/serve");
        docProps.setAllowedContentTypes(List.of("image/png", "application/pdf"));
        FileStorageService docService = new FileStorageService(docProps);

        MockMultipartFile pdf = new MockMultipartFile(
                "file", "설계도.pdf", "application/pdf", "PDFDATA".getBytes());

        FileUploadResponse res = docService.store(pdf);

        assertThat(res.url()).endsWith(".pdf");
        assertThat(res.fileName()).isEqualTo("설계도.pdf");
        assertThat(res.contentType()).isEqualTo("application/pdf");
    }

    @Test
    @DisplayName("저장파일명_UUID생성_원본명과무관")
    void store_generatesUuidName_notOriginal() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "original.jpg", "image/jpeg", "JPG".getBytes());
        FileUploadResponse res = service.store(file);
        String stored = res.url().substring(res.url().lastIndexOf('/') + 1);
        assertThat(stored).doesNotContain("original");
        assertThat(stored).matches("[0-9a-f\\-]{36}\\.jpg");
    }

    @Test
    @DisplayName("저장된파일_load_정상Resource반환")
    void load_existingFile_returnsResource() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "x.png", "image/png", "DATA".getBytes());
        FileUploadResponse res = service.store(file);
        String stored = res.url().substring(res.url().lastIndexOf('/') + 1);

        Resource resource = service.load(stored);
        assertThat(resource.exists()).isTrue();
    }

    @Test
    @DisplayName("없는파일_load_거부됨")
    void load_missing_throws() {
        assertThatThrownBy(() -> service.load("nope.png"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.FILE_NOT_FOUND);
    }

    @Test
    @DisplayName("첨부삭제_저장URL_디스크파일제거")
    void deleteByPath_storedUrl_removesFile() {
        MockMultipartFile file = new MockMultipartFile("file", "d.png", "image/png", "DATA".getBytes());
        FileUploadResponse res = service.store(file);
        String stored = res.url().substring(res.url().lastIndexOf('/') + 1);
        assertThat(Files.exists(tempDir.resolve(stored))).isTrue();

        service.deleteByPath(res.url()); // 저장 URL 전체를 넘겨도 파일명만 뽑아 삭제

        assertThat(Files.exists(tempDir.resolve(stored))).isFalse();
    }

    @Test
    @DisplayName("첨부삭제_없는파일이나traversal_조용히무시")
    void deleteByPath_missingOrTraversal_noThrow() {
        // 예외를 던지지 않아야 함(best-effort). 디렉터리 밖 접근도 무시.
        assertThatCode(() -> service.deleteByPath("/api/v1/files/serve/nope.png")).doesNotThrowAnyException();
        assertThatCode(() -> service.deleteByPath("../../etc/passwd")).doesNotThrowAnyException();
        assertThatCode(() -> service.deleteByPath(null)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("경로traversal_load_거부됨")
    void load_pathTraversal_throws() {
        assertThatThrownBy(() -> service.load("../../etc/passwd"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", WmpErrorCode.FILE_NOT_FOUND);
    }
}
