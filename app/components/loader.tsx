export const Loader = ({ classNames }: { classNames?: string }) => {
  return (
    <svg className={`loading-spinner ${classNames || ""}`} viewBox="0 0 50 50">
      <circle
        className="path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="5"
      ></circle>
    </svg>
  );
};
