<?php

namespace Liquipedia\Extension\LPCodeMirror\Hooks;

use ExtensionRegistry;
use Language;
use MediaWiki\Hook\BeforePageDisplayHook;
use MediaWiki\Hook\MakeGlobalVariablesScriptHook;
use MediaWiki\MediaWikiServices;
use MediaWiki\Preferences\Hook\GetPreferencesHook;
use OutputPage;
use Skin;
use User;

class MainHookHandler implements
	BeforePageDisplayHook,
	GetPreferencesHook,
	MakeGlobalVariablesScriptHook
{

	/**
	 * @param OutputPage $out
	 * @param Skin $skin
	 */
	public function onBeforePageDisplay( $out, $skin ): void {
		$userOptionsLookup = MediaWikiServices::getInstance()->getUserOptionsLookup();
		$option = 'lpcodemirror-prefs-use-codemirror';
		$useCodeMirror = $userOptionsLookup->getOption( $skin->getUser(), $option );
		if (
			$useCodeMirror
			&& in_array( $out->getContext()->getRequest()->getText( 'action' ), [ 'edit', 'submit' ] )
		) {
			$out->addModules( 'ext.LPCodeMirror.codemirror' );
		}
	}

	/**
	 * @param User $user
	 * @param array &$preferences
	 */
	public function onGetPreferences( $user, &$preferences ) {
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

	/**
	 * @param array &$vars
	 * @param OutputPage $out
	 */
	public function onMakeGlobalVariablesScript( &$vars, $out ): void {
		$context = $out->getContext();
		// add CodeMirror vars only for edit pages
		if ( in_array( $context->getRequest()->getText( 'action' ), [ 'edit', 'submit' ] ) ) {
			// initialize global vars
			$vars += [
				'LPCodeMirrorConfig' => $this->getFrontendConfiguraton( $context->getLanguage() ),
			];
		}
	}

	/**
	 * @param Language $lang
	 * @return array
	 */
	private function getFrontendConfiguraton( $lang ) {
		// Use the content language, not the user language. (See T170130.)
		// $lang = MediaWikiServices::getInstance()->getContentLanguage();
		$registry = ExtensionRegistry::getInstance();
		$parser = MediaWikiServices::getInstance()->getParser();
		// initialize configuration
		$tags = array_fill_keys( $parser->getTags(), true );
		unset( $tags[ 'ref' ] );
		$config = [
			'pluginModules' => $registry->getAttribute( 'CodeMirrorPluginModules' ),
			'tagModes' => $registry->getAttribute( 'CodeMirrorTagModes' ),
			'tags' => $tags,
			'doubleUnderscore' => [ [], [] ],
			'functionSynonyms' => $parser->getFunctionSynonyms(),
			'urlProtocols' => $parser->getUrlProtocols(),
			'linkTrailCharacters' => $lang->linkTrail(),
		];
		$mw = $lang->getMagicWords();
		$magicWordFactory = $parser->getMagicWordFactory();
		foreach ( $magicWordFactory->getDoubleUnderscoreArray()->getNames() as $name ) {
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
		foreach ( $magicWordFactory->getVariableIDs() as $name ) {
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

}
