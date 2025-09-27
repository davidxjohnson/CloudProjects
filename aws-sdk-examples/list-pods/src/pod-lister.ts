import * as k8s from '@kubernetes/client-node';

export interface PodListOptions {
    namespace: string;
    pagelimit: number;
    timeout: number;
    dump: boolean;
}

export interface PodLister {
    listPods(options: PodListOptions): Promise<void>;
}

export class KubernetesPodLister implements PodLister {
    private kubeConfig: k8s.KubeConfig;
    private k8sApi: k8s.CoreV1Api;

    constructor(kubeConfig?: k8s.KubeConfig) {
        this.kubeConfig = kubeConfig || new k8s.KubeConfig();
        if (!kubeConfig) {
            this.kubeConfig.loadFromDefault();
        }
        this.k8sApi = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
    }

    async listPods(options: PodListOptions): Promise<void> {
        const { namespace, pagelimit, timeout, dump } = options;
        const cluster = String(this.kubeConfig.getCurrentCluster()?.name);

        console.info(
            "k8s cluster = %s\nnamespace = %s\npage limit = %s\ntimeout = %s\ndump = %s",
            cluster, namespace, pagelimit, timeout, dump
        );

        let nextToken: string | undefined = undefined;
        do {
            await this.k8sApi.listNamespacedPod({
                namespace: namespace,
                limit: pagelimit,
                _continue: nextToken,
                timeoutSeconds: timeout
            })
                .then((res) => {
                    if (dump) {
                        console.info(JSON.stringify(res.items, null, 2));
                    } else {
                        for (const pod of res.items as k8s.V1Pod[]) {
                            console.info(String(pod.metadata?.name));
                        }
                    }
                    nextToken = res.metadata?._continue;
                })
                .catch((error: unknown) => {
                    if (typeof error === 'object' && error !== null && Object.prototype.hasOwnProperty.call(error, 'body')) {
                        const errorWithBody = error as { body: { message: string } };
                        console.error("k8s api returned error:", errorWithBody.body.message);
                    } else {
                        console.error("k8s api not reachable:", error);
                    }
                })
                .finally(() => {
                    console.info("nextToken:", nextToken);
                });
        } while (nextToken != undefined);
        console.info("bye");
    }
}