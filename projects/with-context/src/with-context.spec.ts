import {withCtx, withCtxAwait} from "../lib/with-context";
import {expect} from "chai";
import {Some} from "monet";

describe('with-context', () => {
    it('should work with generic types', () => {
        Some({a: 1})
            .map(withCtx('b', () => ({foo: 10})))
            .map(withCtx('c', () => ({bar: 20})))

        return Promise.resolve({a: 1})
            .then(withCtxAwait('b', () => Promise.resolve({foo: {bar: 10}})))
            .then(withCtxAwait('c', () => Promise.resolve(3)))
    });

    it('should work in a promise context', () => {
        return Promise.resolve({a: 1})
            .then(withCtxAwait('b', ctx => Promise.resolve(ctx.a + 1)))
            .then(withCtxAwait('c', ctx => Promise.resolve(ctx.b.toString())))
            .then(withCtxAwait('d', () => Promise.resolve(10)))
            .then(x => expect(x).to.deep.equal({a: 1, b: 2, c: "2", d: 10}));
    });

    it('should work in a non promise context', () => {
        Some({a: 1})
            .map(withCtx('b', ctx => ctx.a + 1))
            .map(withCtx('c', ctx => ctx.b.toString()))
            .forEach(x => expect(x).to.deep.equal({a: 1, b: 2, c: "2"}));

        return Promise.resolve({a: 1})
            .then(withCtxAwait('b', () => 2))
            .then(withCtxAwait('c', () => Promise.resolve(3)))
            .then(x => expect(x).to.deep.equal({a: 1, b: 2, c: 3}));
    });
});