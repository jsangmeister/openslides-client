import { HttpStream } from 'src/app/gateways/http-stream';

type AfterEventFn = <T>(stream: HttpStream<T>) => void;

export class StreamHandler<T> {
    public get activeStream(): HttpStream<T> | null {
        return this._currentActiveStream;
    }

    private _currentActiveStream: HttpStream<T> | null = null;

    private readonly _afterOpenedFn: AfterEventFn | undefined;
    private readonly _afterClosedFn: AfterEventFn | undefined;

    public constructor(
        private readonly buildStreamFn: () => HttpStream<T>,
        readonly config: {
            afterOpenedFn?: AfterEventFn;
            afterClosedFn?: AfterEventFn;
        } = {}
    ) {
        this._afterOpenedFn = config.afterOpenedFn;
        this._afterClosedFn = config.afterClosedFn;
    }

    public closeCurrentStream(): void {
        const stream = this._currentActiveStream;
        this.destroyStream();
        if (this._afterClosedFn && stream) {
            this._afterClosedFn(stream);
        }
    }

    public openCurrentStream(): void {
        this.reboot();
        if (this._afterOpenedFn && this._currentActiveStream) {
            this._afterOpenedFn(this._currentActiveStream);
        }
    }

    private reboot(): void {
        this.destroyStream();
        this.openStream();
    }

    private openStream(): void {
        if (!this._currentActiveStream) {
            this.build();
        }
        this._currentActiveStream!.open();
    }

    private destroyStream(): void {
        this._currentActiveStream?.close();
        this._currentActiveStream = null;
    }

    private build(): void {
        this._currentActiveStream = this.buildStreamFn();
    }
}
