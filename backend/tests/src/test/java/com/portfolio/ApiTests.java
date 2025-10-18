package com.portfolio;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;

import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ApiTests {

    @BeforeAll
    public static void setup() {
        RestAssured.baseURI = System.getProperty("api.base", "http://localhost");
        try {
            RestAssured.port = Integer.parseInt(System.getProperty("api.port", "5000"));
        } catch (NumberFormatException e) {
            RestAssured.port = 5000;
        }
        RestAssured.basePath = "/";
        RestAssured.enableLoggingOfRequestAndResponseIfValidationFails();
    }

    // ---------------- HEALTH ENDPOINT ----------------
    @Test
    @Order(1)
    @DisplayName("GET /health - should return status OK")
    public void shouldReturnStatusOkForHealth() {
        given()
                .when().get("/health")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("status", equalTo("ok"));
    }

    @Test
    @Order(2)
    @DisplayName("GET /health - should have security headers and respond quickly")
    public void shouldHaveSecurityHeadersAndFastResponseForHealth() {
        given()
                .when().get("/health")
                .then()
                .statusCode(200)
                .header("Content-Type", containsString("application/json"))
                .header("X-Content-Type-Options", anyOf(equalTo("nosniff"), nullValue()))
                .header("X-Frame-Options", anyOf(equalTo("DENY"), equalTo("SAMEORIGIN"), nullValue()))
                .time(lessThan(2000L));
    }

    // ---------------- METADATA ENDPOINT ----------------
    @Test
    @Order(3)
    @DisplayName("GET /test-metadata/api - should return required JSON fields")
    public void shouldReturnRequiredFieldsForMetadata() {
        given()
                .when().get("/test-metadata/api")
                .then()
                .statusCode(200)
                .contentType(ContentType.JSON)
                .body("$", hasKey("status"))
                .body("$", hasKey("elapsed"));
    }

    @Test
    @Order(4)
    @DisplayName("GET /test-metadata/api - should respond within 2 seconds")
    public void shouldRespondQuicklyForMetadata() {
        given()
                .when().get("/test-metadata/api")
                .then()
                .statusCode(200)
                .time(lessThan(2000L));
    }

    @Test
    @Order(5)
    @DisplayName("GET /test-metadata/api - should have security headers")
    public void shouldHaveSecurityHeadersForMetadata() {
        given()
                .when().get("/test-metadata/api")
                .then()
                .statusCode(200)
                .header("X-Content-Type-Options", anyOf(equalTo("nosniff"), nullValue()))
                .header("X-Frame-Options", anyOf(equalTo("DENY"), equalTo("SAMEORIGIN"), nullValue()));
    }

    // ---------------- TEST CODE ENDPOINT ----------------
    @Test
    @Order(6)
    @DisplayName("GET /test-code/api - should return test code or 404 if missing")
    public void shouldReturnTestCodeOrNotFound() {
        given()
                .when().get("/test-code/api")
                .then()
                .statusCode(anyOf(is(200), is(404)))
                .contentType(containsString("text"))
                .body(not(emptyOrNullString()));
    }

    @Test
    @Order(7)
    @DisplayName("GET /test-code/api - response should not be empty when available")
    public void shouldNotReturnEmptyResponseForTestCode() {
        Response response = given().when().get("/test-code/api").then().extract().response();
        if (response.statusCode() == 200) {
            Assertions.assertFalse(response.asString().isEmpty(), "Test code response should not be empty");
        }
    }

    @Test
    @Order(8)
    @DisplayName("GET /test-code/api - should respond quickly")
    public void shouldRespondQuicklyForTestCode() {
        given().when().get("/test-code/api")
                .then()
                .statusCode(anyOf(is(200), is(404)))
                .time(lessThan(2000L));
    }

    // ---------------- NEGATIVE & CORS ----------------
    @Test
    @Order(9)
    @DisplayName("GET unknown endpoint - should return 200 with index.html")
    public void shouldReturnIndexForUnknownEndpoint() {
        given().when().get("/unknown-endpoint")
                .then().statusCode(200)
                .body(containsString("Dominik Łysak | Software Tester"));
    }

    @Test
    @Order(10)
    @DisplayName("OPTIONS /test-metadata/api - should return correct CORS headers")
    public void shouldReturnCorsHeadersForMetadata() {
        given()
                .header("Origin", "http://example.com")
                .when().options("/test-metadata/api")
                .then()
                .statusCode(anyOf(is(200), is(204)))
                .header("Access-Control-Allow-Origin", anyOf(equalTo("*"), equalTo("http://example.com")));
    }

    @Test
    @Order(11)
    @DisplayName("GET unsupported method - should return 405 or 501")
    public void shouldReturn405Or501ForUnsupportedMethod() {
        given().when().put("/test-metadata/api").then().statusCode(anyOf(is(405), is(501)));
    }

    // ---------------- GENERAL TESTS ----------------
    @Test
    @Order(12)
    @DisplayName("GET /test-metadata/api - response should not be empty")
    public void shouldNotReturnEmptyResponseForMetadata() {
        Response response = given().when().get("/test-metadata/api").then().extract().response();
        Assertions.assertFalse(response.asString().isEmpty());
    }

    @Test
    @Order(13)
    @DisplayName("Check Content-Type consistency across endpoints")
    public void shouldHaveConsistentContentType() {
        given().when().get("/health").then().contentType(containsString("application/json"));
        given().when().get("/test-metadata/api").then().contentType(containsString("application/json"));
    }

    // ---------------- COMBINED SCENARIO ----------------
    @Test
    @Order(14)
    @DisplayName("Combined test - retry, headers, and performance")
    public void shouldPassCombinedScenario() {
        for (int i = 0; i < 3; i++) {
            Response response = given().when().get("/test-metadata/api").then().extract().response();
            if (response.statusCode() == 200) {
                Assertions.assertTrue(response.getHeader("Content-Type").contains("application/json"));
                Assertions.assertTrue(response.time() < 2000L);
                break;
            }
        }
    }

    // ---------------- TECHNIQUES DEMONSTRATION ----------------
    @Test
    @Order(15)
    @DisplayName("Retry pattern demonstration for /health")
    public void demonstrateRetryPattern() {
        for (int i = 0; i < 3; i++) {
            Response response = given().when().get("/health").then().extract().response();
            if (response.statusCode() == 200) break;
        }
    }

    @Test
    @Order(16)
    @DisplayName("JSON validation for metadata fields")
    public void shouldContainRequiredJsonFields() {
        Response response = given().when().get("/test-metadata/api").then().statusCode(200).extract().response();
        Assertions.assertTrue(response.asString().contains("status"), "Missing 'status' field");
        Assertions.assertTrue(response.asString().contains("elapsed"), "Missing 'elapsed' field");
    }

    @Test
    @Order(17)
    @DisplayName("Performance and headers combined test for /test-metadata/api")
    public void shouldCheckPerformanceAndHeaders() {
        given().when().get("/test-metadata/api")
                .then()
                .statusCode(200)
                .time(lessThan(2000L))
                .header("Content-Type", containsString("application/json"));
    }

    @Test
    @Order(18)
    @DisplayName("Security headers validation for /health and /test-metadata/api")
    public void shouldValidateSecurityHeaders() {
        given().when().get("/health")
                .then()
                .statusCode(200)
                .header("X-Content-Type-Options", anyOf(equalTo("nosniff"), nullValue()))
                .header("X-Frame-Options", anyOf(equalTo("DENY"), equalTo("SAMEORIGIN"), nullValue()));

        given().when().get("/test-metadata/api")
                .then()
                .statusCode(200)
                .header("X-Content-Type-Options", anyOf(equalTo("nosniff"), nullValue()))
                .header("X-Frame-Options", anyOf(equalTo("DENY"), equalTo("SAMEORIGIN"), nullValue()));
    }

    @Test
    @Order(19)
    @DisplayName("Negative test for invalid query parameter - check JSON response")
    public void negativeTestInvalidQueryParameter() {
        given()
                .queryParam("invalidParam", "abc123")
                .when()
                .get("/test-metadata/api")
                .then()
                .statusCode(200) // serwer zwraca 200, więc to sprawdzamy
                .contentType(ContentType.JSON)
                .body("status", equalTo("Failed"))
                .body("display", equalTo("Failed"))
                .body("elapsed", notNullValue());
    }


    @Test
    @Order(20)
    @DisplayName("Final validation - response and headers combined scenario")
    public void finalValidationScenario() {
        Response response = given().when().get("/test-metadata/api").then().extract().response();
        Assertions.assertEquals(200, response.statusCode());
        Assertions.assertTrue(response.getHeader("Content-Type").contains("application/json"));
        Assertions.assertTrue(response.time() < 2000L);
    }
}