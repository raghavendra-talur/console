import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { SidebarSectionHeading, StatusBox } from '@console/internal/components/utils';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import HelmReleaseNotesEmptyState from '@console/dev-console/src/components/helm/details/notes/HelmReleaseNotesEmptyState';
import { mockHelmReleaseNode, mockManifest, mockReleaseNotes } from './mockData';
import TopologyGroupResourcesPanel from '../../components/side-bar/TopologyGroupResourcesPanel';
import TopologyHelmReleaseNotesPanel from '../TopologyHelmReleaseNotesPanel';
import { ConnectedTopologyHelmReleasePanel } from '../TopologyHelmReleasePanel';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    withTranslation: () => (Component) => {
      Component.defaultProps = { ...Component.defaultProps, t: (s) => s };
      return Component;
    },
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('TopologyHelmReleasePanel', () => {
  it('should render the resources tab by default', () => {
    const component = mount(
      <ConnectedTopologyHelmReleasePanel helmRelease={mockHelmReleaseNode} />,
    );
    expect(component.find(TopologyGroupResourcesPanel)).toHaveLength(1);
  });

  it('should render the details tab when specified', () => {
    const component = mount(
      <ConnectedTopologyHelmReleasePanel
        helmRelease={mockHelmReleaseNode}
        selectedDetailsTab="topology~Details"
      />,
    );
    // Status box displayed because there is no mock secret
    expect(component.find(StatusBox)).toHaveLength(1);
  });

  it('should render the release notes tab when specified', () => {
    const component = mount(
      <ConnectedTopologyHelmReleasePanel
        helmRelease={mockHelmReleaseNode}
        selectedDetailsTab="topology~Release notes"
      />,
    );
    // Status box displayed because there is no mock secret
    expect(component.find(TopologyHelmReleaseNotesPanel)).toHaveLength(1);
  });
});

describe('TopologyHelmReleaseResourcesPanel', () => {
  const manifestResources = mockManifest;

  it('should render the correct number of resource categories', () => {
    const component = shallow(
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace="mock-ns"
      />,
    );
    expect(component.find(SidebarSectionHeading)).toHaveLength(5);
  });
});

describe('TopologyHelmReleaseNotesPanel', () => {
  const releaseNotes = mockReleaseNotes;

  it('should render markdown when release notes are given', () => {
    const component = mount(<TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />);
    expect(component.find(SyncMarkdownView)).toHaveLength(1);
  });

  it('should render empty state when release notes are not given', () => {
    const component = mount(<TopologyHelmReleaseNotesPanel releaseNotes="" />);
    expect(component.find(HelmReleaseNotesEmptyState)).toHaveLength(1);
  });
});
