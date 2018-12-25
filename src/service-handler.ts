import { Request, ResponseToolkit } from 'hapi';
import { notImplemented } from 'boom';
import { database } from './database';
import { serviceDomains } from './service-domains';
import * as assert from 'assert';
import * as _ from 'lodash';

function resolveServiceDomain(serviceDomainName: string, controlRecordName: string) {
    const serviceDomain = serviceDomains[serviceDomainName];
    if (serviceDomain) {
        if (serviceDomain.crName === controlRecordName) {
            return serviceDomain;
        }
        throw new Error(`Not supported control record name '${serviceDomainName}/${controlRecordName}'`);
    }
    throw new Error(`Not supported service '${serviceDomainName}'`);
}

async function retrieveIds(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);

    const response = await database.execute(async (db) => {
        return await db.collection(serviceDomain.crName).find().limit(100).toArray();
    });
    return h.response(response);
}

async function retrieve(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);

    const response = await database.execute(async (db) => {
        return await db.collection(serviceDomain.crName).findOne({ _id: controlRecordId });
    });
    return h.response(response);
}

async function create(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const document = request.payload;

    const insertedId = await database.execute(async (db) => {
        const result = await db.collection(serviceDomain.crName).insertOne(document);
        assert.equal(1, result.insertedCount);
        return result.insertedId;
    });

    return h.response().code(201).location(insertedId.toHexString());
}

async function update(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const document = request.payload;

    const updatedDocument = await database.execute(async (db) => {
        const collection = db.collection(serviceDomain.crName);
        const result = await collection.updateOne({ _id: controlRecordId }, document);
        assert.equal(1, result.matchedCount);
        assert.equal(1, result.modifiedCount);
        return await collection.findOne({ _id: controlRecordId });
    });

    return h.response(updatedDocument);
}

async function retrieveQualifiers(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);

    const response = _.map(serviceDomain.qualifiers, q => q.name);
    return h.response(response);
}

async function retrieveQualifiedIds(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;
    const businessQualifierName = request.params.bqName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const projection = { _id: 0 };
    projection[businessQualifierName] = { _id: 1 };

    const response = await database.execute(async (db) => {
        const document = await db.collection(serviceDomain.crName).findOne({ _id: controlRecordId }, { projection: projection });
        return document[businessQualifierName];
    });
    return h.response(response);
}

async function createQualified(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;
    const businessQualifierName = request.params.bqName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const document = request.payload;

    const response = await database.execute(async (db) => {
        const collection = db.collection(serviceDomain.crName);
        const result = await collection.updateOne(
            { _id: controlRecordId },
            { $set: { 'grades.$[elem].mean' : 100 } },
            { arrayFilters: [ { 'elem.grade': { $gte: 85 } } ] });
            return result;
    });
    return h.response(response);
}

export const serviceHandler = {
    retrieveIds: retrieveIds,
    create: create,
    retrieve: retrieve,
    update: update,
    retrieveQualifiers: retrieveQualifiers,
    retrieveQualifiedIds: retrieveQualifiedIds,
    retrieveQualified: notImplemented,
    createQualified: createQualified,
    updateQualified: notImplemented,
};