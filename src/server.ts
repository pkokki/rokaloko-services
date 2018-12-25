import { Server } from 'hapi';
import { serviceHandler } from './service-handler';

// Create a server with a host and port
const server = new Server({
    host: 'localhost',
    port: 8000
});

// Define routes
const routes = [
    // { method: 'GET', path: '/services', handler: serviceHandler.retrieveServiceDomains },
    // { method: 'GET', path: '/services/{sdName}', handler: serviceHandler.retrieveControlRecord },

    { method: 'GET', path: '/services/{sdName}/{crName}', handler: serviceHandler.retrieveIds },

    { method: 'POST', path: '/services/{sdName}/{crName}', handler: serviceHandler.create },
    // { method: 'POST', path: '/services/{sdName}/{crName}/executions', handler: serviceHandler.executeCreate },
    // { method: 'POST', path: '/services/{sdName}/{crName}/requests', handler: serviceHandler.requestCreate },

    { method: 'GET', path: '/services/{sdName}/{crName}/{crId}', handler: serviceHandler.retrieve },

    { method: 'PUT', path: '/services/{sdName}/{crName}/{crId}', handler: serviceHandler.update },
    // { method: 'PUT', path: '/services/{sdName}/{crName}/executions/{crId}', handler: serviceHandler.executeUpdate },
    // { method: 'PUT', path: '/services/{sdName}/{crName}/requests/{crId}', handler: serviceHandler.requestUpdate },

    // { method: 'POST', path: '/services/{sdName}/{crName}/recordings/{crId}', handler: serviceHandler.record },

    { method: 'GET', path: '/services/{sdName}/{crName}/qualifiers', handler: serviceHandler.retrieveQualifiers },

    { method: 'GET', path: '/services/{sdName}/{crName}/{crId}/{bqName}', handler: serviceHandler.retrieveQualifiedIds },
    { method: 'GET', path: '/services/{sdName}/{crName}/{crId}/{bqName}/{bqId}', handler: serviceHandler.retrieveQualified },
    { method: 'POST', path: '/services/{sdName}/{crName}/{crId}/{bqName}', handler: serviceHandler.createQualified },
    { method: 'PUT', path: '/services/{sdName}/{crName}/{crId}/{bqName}/{bqId}', handler: serviceHandler.updateQualified },
];

// Add routes
server.route(routes);

// Unhandled rejection handler
process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

// Start the server
export const start = async function () {

    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};
