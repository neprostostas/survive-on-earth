import type { ItemResult, ResourceResultSink, ResultWorldPoint } from "./ItemResult";

export class CompositeResourceResultSink implements ResourceResultSink {
  constructor(private readonly sinks: readonly ResourceResultSink[]) {}

  handle(result: ItemResult, position: ResultWorldPoint): void {
    for (const sink of this.sinks) sink.handle(result, position);
  }
}
