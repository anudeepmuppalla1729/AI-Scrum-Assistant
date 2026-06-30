const { pipeline } = require("@huggingface/transformers");

class CustomHuggingFaceEmbeddings {
  constructor(options = {}) {
    this.model = options.model || "nomic-ai/nomic-embed-text-v1.5";
    this.pretrainedOptions = options.pretrainedOptions || {};
    this.pipelinePromise = null;
  }

  async initPipeline() {
    if (!this.pipelinePromise) {
      this.pipelinePromise = pipeline("feature-extraction", this.model, this.pretrainedOptions);
    }
    return this.pipelinePromise;
  }

  async embedDocuments(texts) {
    const pipe = await this.initPipeline();
    const responses = await Promise.all(
      texts.map(text => pipe(text, { pooling: "mean", normalize: true }))
    );
    return responses.map(res => res.tolist()[0]);
  }

  async embedQuery(text) {
    const pipe = await this.initPipeline();
    const res = await pipe(text, { pooling: "mean", normalize: true });
    return res.tolist()[0];
  }
}

module.exports = { CustomHuggingFaceEmbeddings };
