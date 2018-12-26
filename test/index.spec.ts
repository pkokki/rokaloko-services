import { serverStart, serverStop } from '../src/server';

const expect = require('chai').expect;
const should = require('chai').should();

before(function(done) {
    serverStart().then(done).catch(done);
});

after(function(done) {
    serverStop().then(done).catch(done);
});

describe('smoke tests', () => {

    it('expect \'expect\' to succeed', () => {
        expect(true).to.be.a('boolean');
    });

    it('\'should\' should succeed', () => {
        true.should.be.a('boolean');
    });

});