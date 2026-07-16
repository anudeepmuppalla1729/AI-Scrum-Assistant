/**
 * Create a mock Mongoose model with common CRUD methods.
 * Tracks calls for assertion.
 */
export const createMockModel = (name, defaultDoc = {}) => {
  const store = new Map();
  let idCounter = 1;

  const Model = {
    _name: name,
    _store: store,

    async findById(id) {
      return store.get(id) || null;
    },

    async findOne(filter) {
      for (const doc of store.values()) {
        const match = Object.entries(filter).every(([k, v]) => {
          if (typeof v === "object" && v.$exists) return doc[k] !== undefined;
          return doc[k] === v;
        });
        if (match) return doc;
      }
      return null;
    },

    async find(filter = {}) {
      const results = [];
      for (const doc of store.values()) {
        const match = Object.entries(filter).every(([k, v]) => doc[k] === v);
        if (match) results.push(doc);
      }
      return results;
    },

    async findByIdAndUpdate(id, update) {
      const doc = store.get(id);
      if (!doc) return null;
      Object.assign(doc, update.$set || update);
      return doc;
    },

    async updateOne(filter, update) {
      const doc = await this.findOne(filter);
      if (doc) Object.assign(doc, update.$set || update);
      return { matchedCount: doc ? 1 : 0, modifiedCount: doc ? 1 : 0 };
    },

    async save() {
      if (!this._id) {
        this._id = `mock-id-${idCounter++}`;
      }
      store.set(this._id, this);
      return this;
    },
  };

  // Constructor function (used with `new`)
  const MockModel = function (data = {}) {
    Object.assign(this, { ...defaultDoc, ...data });
    this._id = data._id || `mock-id-${idCounter++}`;
    this.save = async () => {
      store.set(this._id, this);
      return this;
    };
  };
  MockModel.prototype = Model;
  Object.assign(MockModel, Model);

  return MockModel;
};
