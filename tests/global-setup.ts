import type { GlobalSetupContext } from 'vitest/node'

export default function setup({ provide }: GlobalSetupContext) {
    process.env.EDITOR = '';
};
