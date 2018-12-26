import * as assert from 'assert';
import * as Boom from 'boom';
import { Request, ResponseToolkit } from 'hapi';
import * as Joi from 'joi';
import * as _ from 'lodash';
import { ObjectId, ObjectID } from 'mongodb';
import { dbClient } from './database';
import { serviceDomains } from './service-domains';

function resolveServiceDomain(serviceDomainName: string, controlRecordName: string) {
    const serviceDomain = serviceDomains[serviceDomainName];
    if (serviceDomain) {
        if (serviceDomain.crParameterName === controlRecordName) {
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
    const items = await dbClient.db.collection(serviceDomain.crParameterName).find().project({ _id: 1 }).limit(100).toArray();

    const response = {
        items: _.map<any, string>(items, o => o._id.toHexString())
    };
    console.log(response);
    return h.response(response);
}

async function retrieve(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);

    const result = await dbClient.db.collection(serviceDomain.crParameterName).findOne({ _id: new ObjectId(controlRecordId) });
    if (result === null) {
        return Boom.notFound();
    }

    const response = {};
    response[serviceDomain.crPropertyName + 'Id'] = result._id.toHexString();
    return h.response(response);
}

async function create(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const document = request.payload || {};

    const result = await dbClient.db.collection(serviceDomain.crParameterName).insertOne(document);
    assert.equal(1, result.insertedCount);
    const insertedId = result.insertedId.toHexString();

    return h.response()
        .code(201)
        .location(`${request.url.href}/${insertedId}`);
}

async function update(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const document = request.payload;

    const collection = dbClient.db.collection(serviceDomain.crParameterName);
    const result = await collection.updateOne({ _id: controlRecordId }, document);
    assert.equal(1, result.matchedCount);
    assert.equal(1, result.modifiedCount);
    const updatedDocument = await collection.findOne({ _id: controlRecordId });

    return h.response(updatedDocument);
}

async function retrieveQualifiers(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);

    const qualifiers = _.map(serviceDomain.qualifiers, q => q.name);
    return h.response({
        items: qualifiers
    });
}

async function retrieveQualifiedIds(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;
    const businessQualifierName = request.params.bqName;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const query = { _id: controlRecordId };
    const projection = { _id: 0 };
    projection[businessQualifierName] = { _id: 1 };

    const document = await dbClient.db.collection(serviceDomain.crParameterName).findOne(query, { projection: projection });
    const response = document[businessQualifierName];

    return h.response(response);
}

async function createQualified(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;
    const businessQualifierName = request.params.bqName;
    const subDocument = request.payload;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);
    const qualifier = serviceDomain.qualifiers[businessQualifierName];
    const validationError = Joi.validate(subDocument, qualifier.schema);
    if (validationError.error === null) {
        const insertedId = new ObjectID();
        subDocument['_id'] = insertedId;

        const collection = dbClient.db.collection(serviceDomain.crParameterName);
        const $push = {};
        $push[businessQualifierName] = subDocument;
        const result = await collection.updateOne(
            { _id: new ObjectId(controlRecordId) },
            { $push: $push });
        if (result.modifiedCount === 1) {
            return h.response().code(201).location(`${request.url.href}/${insertedId}`);
        }
        return Boom.notFound();
    }
    return Boom.badRequest(validationError.error.message);
}

async function retrieveQualified(request: Request, h: ResponseToolkit) {
    const serviceDomainName = request.params.sdName;
    const controlRecordName = request.params.crName;
    const controlRecordId = request.params.crId;
    const businessQualifierName = request.params.bqName;
    const businessQualifierId = request.params.bqId;

    const serviceDomain = resolveServiceDomain(serviceDomainName, controlRecordName);

    const query = {
        '_id': new ObjectID(controlRecordId)
    };
    const projection = {};
    projection[businessQualifierName] = { $elemMatch: { _id: new ObjectID(businessQualifierId) } };
    const result = await dbClient.db.collection(serviceDomain.crParameterName).findOne(query, { projection: projection });
    if (result === null || !result.hasOwnProperty(businessQualifierName)) {
        return Boom.notFound();
    }

    const response = {};
    response[serviceDomain.crPropertyName + 'Id'] = result._id;
    response[businessQualifierName + 'Id'] = result[businessQualifierName][0]._id;
    response[businessQualifierName + 'Reference'] = result[businessQualifierName][0][businessQualifierName + 'Id'];
    return h.response(response);
}

export const serviceHandler = {
    retrieveIds: retrieveIds,
    create: create,
    retrieve: retrieve,
    update: update,
    retrieveQualifiers: retrieveQualifiers,
    retrieveQualifiedIds: retrieveQualifiedIds,
    retrieveQualified: retrieveQualified,
    createQualified: createQualified,
    updateQualified: Boom.notImplemented,
};