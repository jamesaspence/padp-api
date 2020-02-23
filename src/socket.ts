import * as socketIO from 'socket.io';
import * as RandomString from 'randomstring';

const CONNECTION_EVENT = 'connection';
const DISCONNECTION_EVENT = 'disconnect';
const USER_COUNT_CHANGED_EVENT = 'userCount';

//TODO add logger
class SocketManager {
  server: any;
  io: any;
  namespaceKeys: string[];

  constructor(server) {
    this.server = server;
    this.io = socketIO(server);
    this.namespaceKeys = [];
  }

  createNamespace() {
    const namespaceKey = this.generateNamespaceKey();
    this.namespaceKeys.push(namespaceKey);
    this.initializeNamespaceEvents(namespaceKey);

    return namespaceKey;
  }

  initializeNamespaceEvents(key) {
    const namespace = this.getNamespace(key);
    namespace.on(CONNECTION_EVENT, socket => {
      const numberOfUsers = this.getNumberOfUsers(key);
      this.emitUserCountChange(key, numberOfUsers);

      socket.on(DISCONNECTION_EVENT, () => {
        const numberOfUsers = this.getNumberOfUsers(key);
        if (numberOfUsers === 0) {
          this.deleteNamespace(key);
          return;
        }

        console.log();
        this.emitUserCountChange(key, numberOfUsers);
      });
    });
  }

  emitUserCountChange(key, userCount) {
    this.emitToNamespace(key, USER_COUNT_CHANGED_EVENT, {
      count: userCount
    });
  }

  deleteNamespace(key) {
    if (!this.namespaceExists(key)) {
      return;
    }

    const namespace = this.getNamespace(key);
    const connectedNameSpaceSockets = Object.keys(namespace.connected);
    connectedNameSpaceSockets.forEach(socketId => {
      namespace.connected[socketId].disconnect();
    });
    namespace.removeAllListeners();
    console.log(Object.keys(this.io.nsps));
    delete this.io.nsps[SocketManager.appendSlashToKey(key)];
    const index = this.namespaceKeys.indexOf(key);
    this.namespaceKeys.splice(index, 1);
  }

  emitToNamespace(key, event, payload) {
    const namespace = this.getNamespace(key);

    if (namespace === null) {
      //TODO handle properly
      return;
    }

    namespace.emit(event, payload);
  }

  getNumberOfUsers(key) {
    const namespace = this.getNamespace(key);

    if (namespace === null) {
      return 0;
    }

    return Object.keys(namespace.connected).length;
  }

  getNamespace(key) {
    const namespaceKey = SocketManager.appendSlashToKey(key);
    return this.namespaceExists(key) ? this.io.of(namespaceKey) : null;
  }

  generateNamespaceKey() {
    let namespaceKey = new Buffer(RandomString.generate()).toString('base64');
    while (this.namespaceExists(namespaceKey)) {
      namespaceKey = new Buffer(RandomString.generate()).toString('base64');
    }

    return SocketManager.appendSlashToKey(namespaceKey);
  }

  namespaceExists(key) {
    return this.namespaceKeys.indexOf(SocketManager.appendSlashToKey(key)) > -1;
  }

  static appendSlashToKey(key) {
    return key.startsWith('/') ? key : `/${key}`;
  }
}

export default SocketManager;