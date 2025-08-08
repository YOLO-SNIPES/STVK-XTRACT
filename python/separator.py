import sys
import demucs.separate

def main():
    if len(sys.argv) < 2:
        print("Usage: python separator.py <audio_file_path> [output_dir]")
        sys.exit(1)

    audio_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "separated"

    print(f"Starting separation for: {audio_file}")
    print(f"Output directory: {output_dir}")

    # We will use the main function from demucs.separate
    # The arguments should be a list of strings, similar to command line arguments.
    # We need to specify the output directory, the input file, and any other options.
    # The -o flag is used to specify the output directory.
    args = ["-o", output_dir, audio_file]

    try:
        demucs.separate.main(args)
        print("Separation complete.")
    except Exception as e:
        print(f"An error occurred during separation: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
