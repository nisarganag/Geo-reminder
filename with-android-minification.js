const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withAndroidMinification(config) {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            const buildGradle = config.modResults.contents;

            // regex to find the release block and injection point
            // We look for the release block and replace the default values or append ours

            // Replace existing calls if they exist to force them to true
            let newBuildGradle = buildGradle
                // Replace potential variable usage with explicit true
                .replace(/shrinkResources\s+(.*)/g, 'shrinkResources true')
                .replace(/minifyEnabled\s+(.*)/g, 'minifyEnabled true');

            // If they don't exist in a way we caught, we ensures they are in the release block
            // But usually 'npx expo prebuild' generates them using variables.
            // The safest way for a standard expo template is replacing the variable usage.
            // A standard expo android/app/build.gradle has:
            // shrinkResources enableShrinkResources.toBoolean()
            // minifyEnabled enableMinifyInReleaseBuilds

            newBuildGradle = newBuildGradle.replace(
                'shrinkResources enableShrinkResources.toBoolean()',
                'shrinkResources true'
            );

            newBuildGradle = newBuildGradle.replace(
                'minifyEnabled enableMinifyInReleaseBuilds',
                'minifyEnabled true'
            );

            config.modResults.contents = newBuildGradle;
        }
        return config;
    });
};
