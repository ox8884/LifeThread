import { resetDemo } from "../../src/application/demo/reset-demo";
import { getRuntimeRepository } from "../../src/infrastructure/runtime";

const aggregate = await resetDemo(getRuntimeRepository());
console.log(
  `DEMO_RESET_OK adapter=recorded_fixture actor=demo_user thread=${aggregate.thread.id} version=${aggregate.thread.version}`,
);
