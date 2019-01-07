"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Container_1 = require("./lib/Container");
const container = new Container_1.Container();
(() => __awaiter(this, void 0, void 0, function* () {
    try {
        let result;
        container.literal({
            a() {
                return 10;
            },
            b({ a }) {
                return a;
            }
        });
        result = yield container.invoke(({ b }) => __awaiter(this, void 0, void 0, function* () {
            return b;
        }));
        console.log(result);
    }
    catch (error) {
        console.log(error);
    }
}))();
//# sourceMappingURL=index.js.map