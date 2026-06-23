package com.therecommerce.workmap;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * WorkMap(업무지도) 백엔드 진입점.
 * - bp-common-lib(com.therecommerce.common.*) 자동 구성 포함 위해 scanBasePackages 확장.
 * - 영속성은 MyBatis(@Mapper). JPA 미사용(조직 표준).
 */
@SpringBootApplication(scanBasePackages = {"com.therecommerce.workmap", "com.therecommerce.common"})
@ConfigurationPropertiesScan(basePackages = {"com.therecommerce.workmap", "com.therecommerce.common"})
@MapperScan("com.therecommerce.workmap.**.mapper")
public class WorkmapApplication {

    public static void main(String[] args) {
        SpringApplication.run(WorkmapApplication.class, args);
    }
}
