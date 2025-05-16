var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
require("dotenv").config();
import PersonalDataErasure from "../../src/main";
import silentLogger from "../../src/utils/logger";
import { describe, expect, test } from "@jest/globals";
describe("::", function () {
    var logger = __assign({}, silentLogger);
    var projectKey = process.env.CTP_PROJECT_KEY || "";
    var config = {
        apiUrl: "https://api.europe-west1.gcp.commercetools.com",
        host: "https://auth.europe-west1.gcp.commercetools.com",
        projectKey: projectKey,
        credentials: {
            clientId: process.env.CTP_CLIENT_ID || "",
            clientSecret: process.env.CTP_CLIENT_SECRET || "",
            projectKey: projectKey,
        },
    };
    var personalDataErasure;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            personalDataErasure = new PersonalDataErasure({
                logger: logger,
                apiConfig: __assign({}, config),
            });
            return [2 /*return*/];
        });
    }); });
    describe("::constructor", function () {
        test("should throw an error is instance is misconfigured", function () {
            expect(function () { return new PersonalDataErasure({}); }).toThrow();
        });
        test("should return a class instance with public methods and properties", function () {
            var instance = new PersonalDataErasure({
                logger: logger,
                apiConfig: __assign({}, config),
            });
            expect(typeof instance).toBe("object");
            expect(instance).toHaveProperty("client");
            expect(instance).toHaveProperty("apiRoot");
        });
    });
    describe("::getCustomerData", function () {
        var customerId, customer, store;
        beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, personalDataErasure
                            .getApiRoot()
                            .withProjectKey({ projectKey: projectKey })
                            .stores()
                            .post({
                            body: {
                                key: Date.now().toString(36),
                            },
                        })
                            .execute()];
                    case 1:
                        store = _a.sent();
                        return [4 /*yield*/, personalDataErasure
                                .getApiRoot()
                                .withProjectKey({ projectKey: projectKey })
                                .customers()
                                .post({
                                body: {
                                    email: "example.customer-mail@sample.com",
                                    password: Date.now().toString(),
                                },
                            })
                                .execute()];
                    case 2:
                        customer = _a.sent();
                        customerId = customer.body.customer.id;
                        return [2 /*return*/];
                }
            });
        }); });
        afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
            var api;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        api = personalDataErasure
                            .getApiRoot()
                            .withProjectKey({ projectKey: projectKey });
                        return [4 /*yield*/, api
                                .inStoreKeyWithStoreKeyValue({ storeKey: store.body.key })
                                .customers()
                                .withId({ ID: customerId })
                                .delete({ queryArgs: { version: customer.body.customer.version } })
                                .execute()];
                    case 1:
                        _a.sent();
                        // delete store
                        return [4 /*yield*/, api
                                .stores()
                                .withId({ ID: store.body.id })
                                .delete({ queryArgs: { version: store.body.version } })
                                .execute()];
                    case 2:
                        // delete store
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        test("should return customers default personal data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var personalData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, personalDataErasure.getCustomerData(customerId)];
                    case 1:
                        personalData = _a.sent();
                        expect(personalData).toBeDefined();
                        expect(personalData.length).toBeGreaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); });
        test("should include an arbitrary request to default personal data", function () { return __awaiter(void 0, void 0, void 0, function () {
            var personalData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, personalDataErasure.getCustomerData(customerId, function (builder) { return __awaiter(void 0, void 0, void 0, function () {
                            var request;
                            return __generator(this, function (_a) {
                                request = builder
                                    .inStoreKeyWithStoreKeyValue({ storeKey: store.body.key })
                                    .customers()
                                    .get({ queryArgs: { where: "id = \"".concat(customerId, "\"") } })
                                    .clientRequest();
                                return [2 /*return*/, [request]];
                            });
                        }); }, { merge: true })];
                    case 1:
                        personalData = _a.sent();
                        expect(personalData).toBeDefined();
                        expect(personalData.length).toEqual(2);
                        return [2 /*return*/];
                }
            });
        }); });
        test("should create a arbitrary request and not include it tod default request list", function () { return __awaiter(void 0, void 0, void 0, function () {
            var personalData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, personalDataErasure.getCustomerData(customerId, function (builder) { return __awaiter(void 0, void 0, void 0, function () {
                            var request;
                            return __generator(this, function (_a) {
                                request = builder
                                    .inStoreKeyWithStoreKeyValue({ storeKey: store.body.key })
                                    .customers()
                                    .get({ queryArgs: { where: "id = \"".concat(customerId, "\"") } })
                                    .clientRequest();
                                return [2 /*return*/, [request]];
                            });
                        }); }, { merge: false })];
                    case 1:
                        personalData = _a.sent();
                        expect(personalData).toBeDefined();
                        expect(personalData.length).toEqual(1);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    test("should call the `execute` with a generic request", function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiRoot, projectDetailsRequest, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiRoot = personalDataErasure.getApiRoot();
                    projectDetailsRequest = apiRoot
                        .withProjectKey({
                        projectKey: projectKey,
                    })
                        .get()
                        .clientRequest();
                    return [4 /*yield*/, personalDataErasure.execute(projectDetailsRequest)];
                case 1:
                    response = _a.sent();
                    expect(typeof response).toEqual("object");
                    expect(response.statusCode).toEqual(200);
                    expect(response.body.key).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
