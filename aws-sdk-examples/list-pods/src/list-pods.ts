/* Program Description/notes:
   This program queries k8s for a list of pods in a given namespace.
   The k8s context must be set prior to invoking this program.
   See -h flag for command options.
*/
import { Command, Option } from 'commander';
import { KubernetesPodLister, PodListOptions } from './pod-lister.js';

export function parseCommandLineOptions(argv: string[] = process.argv): PodListOptions {
  const flag: Command = new Command()
  flag
    .addOption(new Option('-n --namespace <string>', 'The k8s namespace to use.').default('kube-system'))
    .addOption(new Option('-p --pagelimit <number>', 'The max number of items output per page.').default(10))
    .addOption(new Option('-t --timeout <number>', 'The max time to wait for a response.').default(10))
    .addOption(new Option('-d --dump', 'Output all content of pod objects.').default(false))
    .showHelpAfterError()
    .parse(argv);

  const options: PodListOptions = {
    namespace: flag.opts()['namespace'],
    pagelimit: flag.opts()['pagelimit'],
    timeout: flag.opts()['timeout'],
    dump: flag.opts()['dump']
  };

  return options;
}

export async function runListPods(options: PodListOptions): Promise<void> {
  const podLister = new KubernetesPodLister();
  await podLister.listPods(options);
}

export async function main(): Promise<void> {
  try {
    const options = parseCommandLineOptions();
    await runListPods(options);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}