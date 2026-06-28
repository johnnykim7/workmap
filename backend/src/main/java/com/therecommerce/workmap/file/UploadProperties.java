package com.therecommerce.workmap.file;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * 파일 업로드 설정(CR-024). application.yml {@code workmap.upload.*}로 조정.
 * 빈 등록은 {@code @ConfigurationPropertiesScan}(WorkmapApplication)이 담당.
 */
@ConfigurationProperties(prefix = "workmap.upload")
@Getter
@Setter
public class UploadProperties {

    /** 저장 디렉터리(로컬 디스크). 기본 /home/therecommerce/workmap/uploads */
    private String dir = "/home/therecommerce/workmap/uploads";

    /** 공개 URL prefix. 정적 서빙 경로(GET /api/v1/files/serve/{name})와 동일. */
    private String publicBase = "/api/v1/files/serve";

    /** 허용 MIME 타입. 기본=이미지 4종. */
    private List<String> allowedContentTypes = List.of(
            "image/png", "image/jpeg", "image/gif", "image/webp");
}
