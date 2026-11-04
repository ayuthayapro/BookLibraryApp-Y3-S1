import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-sm max-w-xl mx-auto my-8 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-900">
                            {this.props.title || 'Something went wrong in this view'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {this.state.error?.message || 'An unexpected rendering error occurred. Please refresh or retry.'}
                        </p>
                    </div>
                    <div className="pt-2">
                        <Button 
                            variant="primary" 
                            icon={RefreshCw} 
                            onClick={this.handleReset}
                        >
                            Reload View
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

