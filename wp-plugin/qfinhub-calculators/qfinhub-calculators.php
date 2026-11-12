<?php
/**
 * Plugin Name:       QFINHUB Financial Calculators
 * Plugin URI:        https://www.qfinhub.com/wordpress
 * Description:       Financial calculators as Gutenberg blocks and shortcodes — mortgage, loans, investing, retirement, debt and savings. No iframe, no jQuery, no external requests, no tracking.
 * Version:           0.1.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            QFINHUB
 * Author URI:        https://www.qfinhub.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       qfinhub-calculators
 *
 * @package QFINHUB_Calculators
 */

defined( 'ABSPATH' ) || exit;

define( 'QFINHUB_CALC_VERSION', '0.1.0' );
define( 'QFINHUB_CALC_FILE', __FILE__ );
define( 'QFINHUB_CALC_PATH', plugin_dir_path( __FILE__ ) );
define( 'QFINHUB_CALC_URL', plugin_dir_url( __FILE__ ) );

require_once QFINHUB_CALC_PATH . 'includes/class-calculator-registry.php';
require_once QFINHUB_CALC_PATH . 'includes/class-assets.php';
require_once QFINHUB_CALC_PATH . 'includes/class-shortcode.php';
require_once QFINHUB_CALC_PATH . 'includes/class-block.php';

/**
 * Boot the plugin.
 */
function qfinhub_calc_init() {
	QFINHUB_Assets::init();
	QFINHUB_Shortcode::init();
	QFINHUB_Block::init();
}
add_action( 'plugins_loaded', 'qfinhub_calc_init' );

/**
 * Activation: nothing to migrate yet, but keep a version stamp so future
 * upgrades can detect what they are running against.
 */
function qfinhub_calc_activate() {
	if ( ! get_option( 'qfinhub_calc_version' ) ) {
		add_option( 'qfinhub_calc_version', QFINHUB_CALC_VERSION );
	}
}
register_activation_hook( __FILE__, 'qfinhub_calc_activate' );
