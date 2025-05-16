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
describe("PersonalDataErasure", function () {
    var logger = __assign({}, silentLogger);
    var config = {
        host: "https://sample-host.com",
        apiUrl: "https://sample-api-url.com",
        projectKey: "sample-project-key",
        credentials: {
            clientId: "sample-clientId",
            clientSecret: "sample-clientSecret",
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
        test("should be a function", function () {
            expect(typeof personalDataErasure).toBe("object");
            expect(typeof PersonalDataErasure).toBe("function");
        });
        test("should set default properties", function () {
            expect(personalDataErasure.logger).toEqual(logger);
            expect(personalDataErasure.apiConfig).toEqual(config);
        });
        test("should configure with instance with an existing token", function () {
            var _personalDataErasure = new PersonalDataErasure({
                logger: logger,
                accessToken: "access-token",
                apiConfig: __assign({}, config),
            });
            expect(_personalDataErasure).toHaveProperty("logger");
            expect(_personalDataErasure).toHaveProperty("client");
            expect(_personalDataErasure).toHaveProperty("apiRoot");
        });
        test("should throw error if no `apiConfig` in `options` parameter", function () {
            expect(function () { return new PersonalDataErasure({ foo: "bar" }); }).toThrowErrorMatchingSnapshot();
        });
    });
    describe("::getCustomerData", function () {
        var payload;
        describe("with status code 200", function () {
            beforeEach(function () {
                payload = {
                    statusCode: 200,
                    body: {
                        results: [
                            { version: 1, id: "id1" },
                            { version: 1, id: "id2" },
                        ],
                    },
                };
                personalDataErasure.client = {
                    process: jest.fn(function () { return Promise.resolve([payload]); }),
                    execute: jest.fn(function () { return Promise.resolve(payload); }),
                };
            });
            test("should fetch data", function () { return __awaiter(void 0, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, personalDataErasure.getCustomerData("customerId")];
                        case 1:
                            data = _a.sent();
                            expect(data).toMatchSnapshot();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with status code 500", function () {
            beforeEach(function () {
                payload = {
                    statusCode: 500,
                    body: {
                        count: 0,
                        results: [],
                    },
                };
                personalDataErasure.client.process = jest.fn(function (request, callback) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, callback(payload)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
            });
            test("should throw internal server error", function () {
                return expect(personalDataErasure.getCustomerData("customerId")).rejects.toThrowErrorMatchingSnapshot();
            });
        });
        describe("with status code 404", function () {
            beforeEach(function () {
                payload = {
                    statusCode: 404,
                    body: {
                        results: [],
                    },
                };
                personalDataErasure.client = {
                    process: jest.fn(function () { return Promise.resolve([payload]); }),
                    execute: jest.fn(function () { return Promise.resolve(payload); }),
                };
            });
            test("should fetch empty data", function () { return __awaiter(void 0, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, personalDataErasure.getCustomerData("customerId")];
                        case 1:
                            data = _a.sent();
                            expect(data).toHaveLength(0);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        test("should retrieve the configured client", function () {
            var client = personalDataErasure.getClient();
            expect(client).toHaveProperty("execute");
            expect(client).toHaveProperty("process");
        });
        test("should reject on error when `execute` is called", function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                personalDataErasure.client = {
                    execute: jest.fn(function () {
                        throw new Error();
                    }),
                };
                expect(function () { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, personalDataErasure.execute({
                                    method: "GET",
                                    uri: "get-resource.com",
                                })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); }).rejects.toThrowError();
                return [2 /*return*/];
            });
        }); });
        test("should retrieve the configured apiRoot", function () {
            var apiRoot = personalDataErasure.getApiRoot();
            expect(apiRoot).toHaveProperty("baseUri");
            expect(apiRoot).toHaveProperty("executeRequest");
        });
        test("should throw error if no customerID is passed", function () {
            expect(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, personalDataErasure.getCustomerData()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            }); }); }).rejects.toThrow();
        });
        test("should throw if `getResourceList` is not a function", function () {
            var getResourceList = "not-a-function";
            expect(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, personalDataErasure.getCustomerData("customerId", getResourceList)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            }); }).rejects.toThrowError("the second argument must be a function");
        });
    });
    describe("::deleteAll", function () {
        describe("with status code 200", function () {
            var payload;
            beforeEach(function () {
                payload = {
                    statusCode: 200,
                    body: {
                        results: [
                            { version: 1, id: "id1" },
                            { version: 1, id: "id2" },
                        ],
                    },
                };
                personalDataErasure.client = {
                    process: jest.fn(function () { return Promise.resolve([payload]); }),
                    execute: jest.fn(function () { return Promise.resolve(payload); }),
                };
            });
            test("should delete data", function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, personalDataErasure.deleteAll("customerId")];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with status code 404", function () {
            var payload;
            beforeEach(function () {
                payload = {
                    statusCode: 404,
                    body: {
                        results: [],
                    },
                };
                personalDataErasure.client = {
                    process: jest.fn(function () { return Promise.resolve([payload]); }),
                    execute: jest.fn(function () { return Promise.resolve(payload); }),
                };
            });
            test("should delete data", function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, personalDataErasure.deleteAll("customerId")];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with status code 500", function () {
            beforeEach(function () {
                var payload = {
                    statusCode: 500,
                    body: {
                        results: [],
                    },
                };
                personalDataErasure.client.execute = jest.fn(function () {
                    return Promise.resolve(payload);
                });
            });
            test("should throw internal server error", function () {
                return expect(personalDataErasure.deleteAll("customerId")).rejects.toThrowErrorMatchingSnapshot();
            });
        });
        test("should throw error if no customerID is passed", function () {
            return expect(personalDataErasure.deleteAll()).rejects.toThrowErrorMatchingSnapshot();
        });
    });
    describe("::buildReference", function () {
        test("should build reference", function () {
            expect(PersonalDataErasure.buildReference(["id1", "id2", "id3"])).toMatchSnapshot();
        });
    });
});
