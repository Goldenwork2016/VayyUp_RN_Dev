import VersionCheck from 'react-native-version-check';

const currentVersion = VersionCheck.getCurrentVersion();

export const validateVersion = async () => {
  const appStoreVersion = await VersionCheck.getLatestVersion();
  return VersionCheck.needUpdate({
    currentVersion: currentVersion,
    latestVersion: appStoreVersion,
  });
};
