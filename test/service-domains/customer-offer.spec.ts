import { ObjectID } from 'bson';
import * as _ from 'lodash';
import { dbClient } from '../../src/database';
import { serviceDomains } from '../../src/service-domains';
import { regexUrlWithObjectId, RESPONSE_PAYLOADS, serverRequest } from '../util';

const should = require('chai').should();

describe('ServiceDomain Customer Offer', () => {

    const serviceDomain = serviceDomains['customer-offer'];
    const serviceUrl = '/services/customer-offer/customer-offer-procedure';

    before(function (done) {
        serviceDomain.should.be.an('object');

        dbClient.db.collection(serviceDomain.crParameterName, { strict: true }, async function(err) {
            if (err === null) {
                await dbClient.db.collection(serviceDomain.crParameterName).drop();
            }
            done();
        });

    });

    after(function (done) {
        done();
    });

    it('should create a new resource with empty payload', async () => {
        const resp = await serverRequest('POST', serviceUrl);
        
        resp.statusCode.should.equal(201);
        resp.headers['location'].should.match(regexUrlWithObjectId(serviceUrl));
    });

    it('should retrieve a list of resource ids', async () => {
        const docs = await dbClient.db.collection(serviceDomain.crParameterName).insertMany([{}, {}]);
        const newIds = _.map(docs.insertedIds, id => id.toHexString());

        const resp = await serverRequest('GET', serviceUrl);

        resp.statusCode.should.equal(200);
        JSON.parse(resp.payload).items.should.contain.all.members(newIds);
    });

    it('should fail to retrieve a not-existing resource', async () => {

        const resp = await serverRequest('GET', `${serviceUrl}/000000000000000000000000`);

        resp.statusCode.should.equal(404);
        JSON.parse(resp.payload).should.eql(RESPONSE_PAYLOADS.NotFound_404);
    });

    it('should retrieve an existing resource', async () => {
        const insertedId = (await dbClient.db.collection(serviceDomain.crParameterName).insertOne({})).insertedId.toHexString();

        const resp = await serverRequest('GET', `${serviceUrl}/${insertedId}`);

        resp.statusCode.should.equal(200);
        JSON.parse(resp.payload).customerOfferProcedureId.should.eql(insertedId);
    });

    it('should retrieve the list of valid business qualifiers', async () => {
        const qualifiers = [ 'customer', 'product' ];

        const resp = await serverRequest('GET', `${serviceUrl}/qualifiers`);

        resp.statusCode.should.equal(200);
        JSON.parse(resp.payload).items.should.have.members(qualifiers);
    });

    it('should set a new qualified identifier', async () => {
        const insertedId = (await dbClient.db.collection(serviceDomain.crParameterName).insertOne({})).insertedId.toHexString();
        const operationUrl = `${serviceUrl}/${insertedId}/customer`;

        const payload = {
            customerId: 'C1234'
        };
        const resp = await serverRequest('POST', operationUrl, payload);
        
        resp.payload.should.equal('');
        resp.statusCode.should.equal(201);
        resp.headers['location'].should.match(regexUrlWithObjectId(operationUrl));
    });

    it('should fail to set a new qualified identifier (not existing resource)', async () => {
        const operationUrl = `${serviceUrl}/000000000000000000000000/customer`;

        const payload = {
            customerId: 'C1234'
        };
        const resp = await serverRequest('POST', operationUrl, payload);
        
        resp.statusCode.should.equal(404);
        should.not.exist(resp.headers['location']);
        JSON.parse(resp.payload).should.eql(RESPONSE_PAYLOADS.NotFound_404);
    });

    it('should fail to set a new qualified identifier (missing qualifier in payload)', async () => {
        const insertedId = (await dbClient.db.collection(serviceDomain.crParameterName).insertOne({})).insertedId.toHexString();
        const operationUrl = `${serviceUrl}/${insertedId}/customer`;

        const payload = {
            productId: 'C1234' // <---- productId instead of customerId
        };
        const resp = await serverRequest('POST', operationUrl, payload);
        
        JSON.parse(resp.payload).should.have.keys(['statusCode', 'error', 'message']);
        resp.statusCode.should.equal(400);
        should.not.exist(resp.headers['location']);
    });

    it('should fail to set a new qualified identifier (additional qualifier in payload)', async () => {
        const insertedId = (await dbClient.db.collection(serviceDomain.crParameterName).insertOne({})).insertedId.toHexString();
        const operationUrl = `${serviceUrl}/${insertedId}/customer`;

        const payload = {
            customerId: 'C1234',
            productId: 'P1234' // <---- productId is not expected
        };
        const resp = await serverRequest('POST', operationUrl, payload);
        
        JSON.parse(resp.payload).should.have.keys(['statusCode', 'error', 'message']);
        resp.statusCode.should.equal(400);
        should.not.exist(resp.headers['location']);
    });

    it('should retrieve an existing qualified resource', async () => {
        await dbClient.db.collection(serviceDomain.crParameterName).insertOne({
            _id: new ObjectID('5c23a4fc5acdb259389328d0'),
            customer: [{
                _id: new ObjectID('5c23a4fc5acdb259389328d1'),
                customerId: 'C1'
            }, {
                _id: new ObjectID('5c23a4fc5acdb259389328d2'),
                customerId: 'C2'
            }]
        });

        const resp = await serverRequest('GET', `${serviceUrl}/5c23a4fc5acdb259389328d0/customer/5c23a4fc5acdb259389328d2`);

        resp.statusCode.should.equal(200);
        JSON.parse(resp.payload).should.eql({
            customerOfferProcedureId: '5c23a4fc5acdb259389328d0',
            customerId: '5c23a4fc5acdb259389328d2',
            customerReference: 'C2',
        });
    });

    it('should fail to retrieve a not existing qualified resource', async () => {
        await dbClient.db.collection(serviceDomain.crParameterName).insertOne({
            _id: new ObjectID('5c23a4fc5acdb259389328c0'),
            customer: [{
                _id: new ObjectID('5c23a4fc5acdb259389328c1'),
                customerId: 'C1'
            }, {
                _id: new ObjectID('5c23a4fc5acdb259389328c2'),
                customerId: 'C2'
            }]
        });

        const resp = await serverRequest('GET', `${serviceUrl}/5c23a4fc5acdb259389328c0/customer/5c23a4fc5acdb259389328c3`);

        resp.statusCode.should.equal(404);
        JSON.parse(resp.payload).should.eql(RESPONSE_PAYLOADS.NotFound_404);
    });

    it('should fail to retrieve a qualified resource from a not existing resource', async () => {
        const resp = await serverRequest('GET', `${serviceUrl}/000000000000000000000000/customer/5c23a4fc5acdb259389328c3`);

        resp.statusCode.should.equal(404);
        JSON.parse(resp.payload).should.eql(RESPONSE_PAYLOADS.NotFound_404);
    });
});