
// scripts/test-ai-logic.ts
// A simple regression test script for AI logic (Domain/State Detection)

// Mock process.env for OpenAI before import
process.env.OPENAI_API_KEY = 'sk-mock-key-for-testing';

import { detectDomainFromContent, classifyState } from '../api/services/AIService';

// --- Test Utilities ---
let passed = 0;
let failed = 0;

const assert = (description: string, condition: boolean, details?: any) => {
    if (condition) {
        console.log(`✅ PASS: ${description}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${description}`);
        if (details) console.error('   Details:', details);
        failed++;
    }
};

const runTests = () => {
    console.log('🚀 Starting AI Logic Regression Tests...\n');

    // --- A. Domain Detection Tests ---
    console.log('--- A. Domain Detection (Content-First) ---');
    
    const domainCases = [
        { input: '今天百家樂長龍又來了', expected: 'baccarat' },
        { input: '這把莊閒單跳真的很穩', expected: 'baccarat' },
        { input: '電子遊戲免遊倍數爆分爽翻', expected: 'slots' },
        { input: '老虎機一直吐分', expected: 'slots' },
        { input: '運彩讓分水位過盤', expected: 'sports' },
        { input: '這場NBA大小分很甜', expected: 'sports' },
        { input: '德州撲克翻牌轉牌all-in', expected: 'poker' },
        { input: '底池超大直接推了', expected: 'poker' },
        { input: '539冷門號連碰中獎', expected: 'lotto' },
        { input: '六合彩版路分析', expected: 'lotto' },
        { input: '今天下雨雨衣破掉', expected: 'default' }, // Pure life
        { input: '心情不好想吃甜點', expected: 'default' }
    ];

    domainCases.forEach(({ input, expected }) => {
        const result = detectDomainFromContent(input);
        assert(`Input: "${input}" -> ${expected}`, result.key === expected, { actual: result.key, matches: result.matches });
    });

    // --- B. Domain Independence from Persona ---
    // (Note: AIService.ts logic for detectDomainFromContent DOES NOT take persona as input, 
    // so this is implicitly tested by the function signature, but we verify inputs don't rely on names)
    console.log('\n--- B. Domain Independence (Architecture Verification) ---');
    assert('detectDomainFromContent does not accept persona name', detectDomainFromContent.length <= 2); 


    // --- C. State Detection Tests ---
    console.log('\n--- C. State Detection & PROMO_RISK ---');

    const stateCases = [
        { input: '今天天氣不錯', expected: 'LIFE' },
        { input: '跟到長龍了超爽', expected: 'HIGHLIGHT' }, // "長龍" hits baccarat domain, "跟到/爽" hits HIGHLIGHT state
        { input: '這場讓分盤口分析', expected: 'ANALYSIS' },
        { input: '私訊領取連結', expected: 'PROMO_RISK' },
        { input: '註冊首儲送體驗金', expected: 'PROMO_RISK' },
        { input: '保證穩贏帶你飛', expected: 'PROMO_RISK' }
    ];

    stateCases.forEach(({ input, expected }) => {
        const result = classifyState(input);
        assert(`Input: "${input}" -> State: ${expected}`, result.state === expected, { actual: result.state, matches: result.matches, flags: result.risk_flags });
    });

    // --- D. Risk Flags Check ---
    console.log('\n--- D. Risk Flags Verification ---');
    const riskInput = '保證穩贏，趕快註冊儲值';
    const riskResult = classifyState(riskInput);
    assert('Detect "guarantee_claim"', riskResult.risk_flags.includes('guarantee_claim'));
    assert('Detect "direct_cta"', riskResult.risk_flags.includes('direct_cta'));


    console.log('\n----------------------------------------');
    console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
};

runTests();
