<?php

namespace Liquipedia\LPCodeMirror;

use ExtensionRegistry;
use MediaWiki\MediaWikiServices;

class Hooks {

	public static function onGetPreferences( $user, &$preferences ) {
		// CodeMirror settings
		$preferences[ 'lpcodemirror-prefs-use-codemirror-phone' ] = [
			'type' => 'check',
			'label-message' => 'lpcodemirror-prefs-use-codemirror-phone',
			'section' => 'editing/lpcodemirror'
		];
		$preferences[ 'lpcodemirror-prefs-use-codemirror-tablet' ] = [
			'type' => 'check',
			'label-message' => 'lpcodemirror-prefs-use-codemirror-tablet',
			'section' => 'editing/lpcodemirror'
		];
		$preferences[ 'lpcodemirror-prefs-use-codemirror' ] = [
			'type' => 'check',
			'label-message' => 'lpcodemirror-prefs-use-codemirror',
			'section' => 'editing/lpcodemirror'
		];
		$preferences[ 'lpcodemirror-prefs-use-codemirror-linewrap' ] = [
			'type' => 'check',
			'label-message' => 'lpcodemirror-prefs-use-codemirror-linewrap',
			'section' => 'editing/lpcodemirror'
		];
	}

	public static function onMakeGlobalVariablesScript( array &$vars, \OutputPage $out ) {
		$config = $out->getConfig();
		$context = $out->getContext();
		// add CodeMirror vars only for edit pages
		if ( in_array( $context->getRequest()->getText( 'action' ), [ 'edit', 'submit' ] ) ) {
			// initialize global vars
			$vars += [
				'LPCodeMirrorConfig' => self::getFrontendConfiguraton( $context->getLanguage() ),
			];
		}
	}

	private static function getFrontendConfiguraton( $lang ) {
		// Use the content language, not the user language. (See T170130.)
		#$lang = MediaWikiServices::getInstance()->getContentLanguage();
		$registry = ExtensionRegistry::getInstance();
		$parser = MediaWikiServices::getInstance()->getParser();
		if ( !isset( $parser->mFunctionSynonyms ) ) {
			$parser->initialiseVariables();
			$parser->firstCallInit();
		}
		// initialize configuration
		$config = [
			'pluginModules' => $registry->getAttribute( 'CodeMirrorPluginModules' ),
			'tagModes' => $registry->getAttribute( 'CodeMirrorTagModes' ),
			'tags' => array_fill_keys( $parser->getTags(), true ),
			'doubleUnderscore' => [ [], [] ],
			'functionSynonyms' => $parser->mFunctionSynonyms,
			'urlProtocols' => $parser->mUrlProtocols,
			'linkTrailCharacters' => $lang->linkTrail(),
		];
		$mw = $lang->getMagicWords();
		#$magicWordFactory = $parser->getMagicWordFactory();
		foreach ( \MagicWord::getDoubleUnderscoreArray()->names as $name ) {
			if ( isset( $mw[ $name ] ) ) {
				$caseSensitive = array_shift( $mw[ $name ] ) == 0 ? 0 : 1;
				foreach ( $mw[ $name ] as $n ) {
					$n = $caseSensitive ? $n : $lang->lc( $n );
					$config[ 'doubleUnderscore' ][ $caseSensitive ][ $n ] = $name;
				}
			} else {
				$config[ 'doubleUnderscore' ][ 0 ][] = $name;
			}
		}
		foreach ( \MagicWord::getVariableIDs() as $name ) {
			if ( isset( $mw[ $name ] ) ) {
				$caseSensitive = array_shift( $mw[ $name ] ) == 0 ? 0 : 1;
				foreach ( $mw[ $name ] as $n ) {
					$n = $caseSensitive ? $n : $lang->lc( $n );
					$config[ 'functionSynonyms' ][ $caseSensitive ][ $n ] = $name;
				}
			}
		}
		return $config;
	}

	public static function onBeforePageDisplay( \OutputPage &$out, \Skin &$skin ) {
		if ( $skin->getUser()->getOption( 'lpcodemirror-prefs-use-codemirror' ) == true && in_array( $out->getContext()->getRequest()->getText( 'action' ), [ 'edit', 'submit' ] ) ) {
			$out->addModules( 'ext.LPCodeMirror.codemirror' );
		}
	}

}
