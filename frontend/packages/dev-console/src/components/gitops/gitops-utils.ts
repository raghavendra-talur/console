import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitOpsManifestData, GitOpsAppGroupData } from './gitops-types';

export const getManifestURLs = (namespaces: K8sResourceKind[]): string[] => {
  const annotation = 'app.openshift.io/vcs-uri';
  return _.uniq(
    namespaces
      .filter((ns) => {
        return !!ns.metadata?.annotations?.[annotation];
      })
      .map((ns) => {
        return ns.metadata?.annotations?.[annotation];
      }),
  );
};

export const fetchAppGroups = async (
  baseURL: string,
  manifestURL: string,
): Promise<GitOpsAppGroupData[]> => {
  let data: GitOpsManifestData;
  try {
    data = await coFetchJSON(`${baseURL}&url=${manifestURL}`);
  } catch {} // eslint-disable-line no-empty
  return data?.applications ?? [];
};

export const fetchAllAppGroups = async (baseURL: string, manifestURLs: string[]) => {
  let emptyMsg: string = null;
  let allAppGroups: GitOpsAppGroupData[] = null;
  if (baseURL) {
    if (_.isEmpty(manifestURLs)) {
      emptyMsg = 'No GitOps Manifest URLs found';
    } else {
      try {
        allAppGroups = _.sortBy(
          _.flatten(
            await Promise.all(
              _.map(manifestURLs, (manifestURL) => fetchAppGroups(baseURL, manifestURL)),
            ),
          ),
          ['name'],
        );
      } catch {} // eslint-disable-line no-empty
      if (_.isEmpty(allAppGroups)) {
        emptyMsg = 'No Application groups found';
      }
    }
  }
  return [allAppGroups, emptyMsg];
};