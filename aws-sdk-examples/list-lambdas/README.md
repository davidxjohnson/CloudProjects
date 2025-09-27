# @cloud-projects/list-lambdas-example

### Description
A TypeScript example demonstrating how to list AWS Lambda functions using the [@aws-sdk/client-lambda](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-lambda/index.html) module. This example is part of the CloudProjects monorepo showcasing modern AWS SDK v3 usage patterns with Node.js. 

### What is noteworthy about this example?
* The v3 version of the client-lambda module delivers improved async functionality that avoids [callback hell](http://callbackhell.com/). This makes the module much easier to use.

* The [improved pagination](https://aws.amazon.com/blogs/developer/pagination-using-async-iterators-in-modular-aws-sdk-for-javascript/) feature of AWS SDK v3 is almost effortless. If you have struggled with v2 pagination, you will appreciate v3.

* If you are trying to keep your code in good form as "strict" TypeScript, you will make the effort provide the type of all the variable you declare, which will sometimes make it nessisary import the type definition. An example of this is line #5 (import type) and line #26 with the argument type assertion for the Paginator type. A comparison of the source .ts code and the "compiled" .js code is edifying.

### Sample run:

**Reminder:** Set your AWS context prior to running this example.

```bash
$ pnpm install  # From monorepo root
$ cd aws-sdk-examples/list-lambdas
$ pnpm build
$ pnpm start --region us-east-1

processing.....
[
  'financials',
  'authentication',
  'repair',
  'operations',
  'workqueue',
  ... 151 more items
]
success!
```