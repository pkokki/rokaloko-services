const expect = require('chai').expect;
const should = require('chai').should();

describe('smoke tests', () => {

    it('expect \'expect\' to succeed', () => {
        expect(true).to.be.a('boolean');
    });

    it('\'should\' should succeed', () => {
        true.should.be.a('boolean');
    });
});