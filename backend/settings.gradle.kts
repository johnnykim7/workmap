rootProject.name = "workmap"

dependencyResolutionManagement {
    repositories {
        mavenCentral()
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/therecommerce-develop/bp-common-lib")
            credentials {
                username = providers.gradleProperty("githubUsername").orNull
                    ?: System.getenv("GITHUB_USERNAME") ?: System.getenv("GITHUB_ACTOR")
                password = providers.gradleProperty("githubToken").orNull
                    ?: System.getenv("GITHUB_TOKEN")
            }
        }
    }
}
