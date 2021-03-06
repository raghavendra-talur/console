import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Alert, FormGroup, ValidatedOptions } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useFormikContext, FormikValues } from 'formik';
import { CheckboxField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  RegistryType,
  BuilderImagesNamespace,
  getImageStreamTags,
} from '../../../utils/imagestream-utils';
import { ImageStreamState, ImageStreamAction, ImageStreamActions } from '../import-types';
import { ImageStreamContext } from './ImageStreamContext';
import ImageStreamNsDropdown from './ImageStreamNsDropdown';
import ImageStreamDropdown from './ImageStreamDropdown';
import ImageStreamTagDropdown from './ImageStreamTagDropdown';

import './ImageStream.scss';

export const initialState: ImageStreamState = {
  hasAccessToPullImage: true,
  loading: false,
  accessLoading: false,
  hasCreateAccess: false,
  selectedImageStream: {},
};

export const ImageStreamReducer = (state: ImageStreamState, action: ImageStreamAction) => {
  const { value } = action;
  switch (action.type) {
    case ImageStreamActions.setHasAccessToPullImage:
      return { ...state, hasAccessToPullImage: value };
    case ImageStreamActions.setLoading:
      return { ...state, loading: value };
    case ImageStreamActions.setAccessLoading:
      return { ...state, accessLoading: value };
    case ImageStreamActions.setHasCreateAccess:
      return { ...state, hasCreateAccess: value };
    case ImageStreamActions.setSelectedImageStream:
      return { ...state, selectedImageStream: value };
    default:
      throw new Error('Invalid action was provided in imagestream reducer');
  }
};

const ImageStream: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: { imageStream, project, registry, isi },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [state, dispatch] = React.useReducer(ImageStreamReducer, initialState);
  const [hasImageStreams, setHasImageStreams] = React.useState(false);
  const {
    hasAccessToPullImage,
    loading,
    accessLoading,
    hasCreateAccess,
    selectedImageStream,
  } = state;

  React.useEffect(() => {
    if (imageStream.namespace !== BuilderImagesNamespace.Openshift) {
      setFieldValue('imageStream.grantAccess', true);
    }
  }, [imageStream.namespace, setFieldValue]);
  const imageStreamTagList = getImageStreamTags(selectedImageStream as K8sResourceKind);
  const isNamespaceSelected = imageStream.namespace !== '' && !accessLoading;
  const isStreamsAvailable = isNamespaceSelected && hasImageStreams && !loading;
  const isTagsAvailable = isStreamsAvailable && !_.isEmpty(imageStreamTagList);
  const isImageStreamSelected = imageStream.image !== '';
  const canGrantAccess =
    hasCreateAccess &&
    isStreamsAvailable &&
    isTagsAvailable &&
    !hasAccessToPullImage &&
    isNamespaceSelected &&
    registry === RegistryType.Internal &&
    imageStream.namespace !== BuilderImagesNamespace.Openshift &&
    project.name !== imageStream.namespace;
  const helperTextInvalid = validated === ValidatedOptions.error && isi.status?.message && (
    <>
      <ExclamationCircleIcon />
      &nbsp;{isi.status?.message}
    </>
  );

  return (
    <>
      <ImageStreamContext.Provider
        value={{ state, dispatch, hasImageStreams, setHasImageStreams, setValidated }}
      >
        <FormGroup
          fieldId="image-stream-dropdowns"
          validated={validated}
          helperTextInvalid={helperTextInvalid}
        >
          <div className="row">
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
              <ImageStreamNsDropdown />
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
              <ImageStreamDropdown />
              <div className="odc-imagestream-separator">/</div>
            </div>
            <div className="col-lg-4 col-md-4 col-sm-4 col-xs-12">
              <ImageStreamTagDropdown />
              <div className="odc-imagestream-separator">:</div>
            </div>
          </div>
        </FormGroup>
        {isNamespaceSelected && isImageStreamSelected && !isTagsAvailable && hasCreateAccess && (
          <div className="odc-imagestream-alert">
            <Alert variant="warning" title={t('devconsole~No Image streams tags found')} isInline>
              {t('devconsole~No tags are available in Image Stream {{image}}', {
                image: imageStream.image,
              })}
            </Alert>
          </div>
        )}
        {isNamespaceSelected && !loading && !isStreamsAvailable && hasCreateAccess && (
          <div className="odc-imagestream-alert">
            <Alert variant="warning" title={t('devconsole~No Image streams found')} isInline>
              {t('devconsole~No Image streams are available in Project {{namespace}}', {
                namespace: imageStream.namespace,
              })}
            </Alert>
          </div>
        )}
        {isNamespaceSelected && !accessLoading && !hasCreateAccess && (
          <div className="odc-imagestream-alert">
            <Alert variant="warning" title={t('devconsole~Permission denied')} isInline>
              {t(
                'devconsole~Service account default does not have authority to pull Images from {{namespace}}. Select another Project to continue.',
                { namespace: imageStream.namespace },
              )}
            </Alert>
          </div>
        )}
        {canGrantAccess && (
          <div className="odc-imagestream-alert">
            <CheckboxField
              name="imageStream.grantAccess"
              label={t(
                'devconsole~Grant service account default authority to pull Images from {{namespace}}',
                { namespace: imageStream.namespace },
              )}
            />
          </div>
        )}
      </ImageStreamContext.Provider>
    </>
  );
};

export default React.memo(ImageStream);
