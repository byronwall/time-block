import React from "react";

type TimeBlockSidebarTicksProps = {
  hours: any[];
  hourScale: (arg0: any) => any;
  formatter: (
    arg0: any
  ) => boolean | React.ReactChild | React.ReactFragment | React.ReactPortal;
};

export function TimeBlockSidebarTicks(props: TimeBlockSidebarTicksProps) {
  //des props
  const { hours, hourScale, formatter } = props;

  return (
    <div
      style={{
        position: "relative",
        width: 100,
      }}
    >
      {hours.map((hour, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            top: hourScale(hour),
            borderTop: "1px solid black",
          }}
        >
          {formatter(hour)}
        </div>
      ))}
    </div>
  );
}
